'use strict';

var VectorDraw = function(element_id, settings) {
    this.board = null;
    this.dragged_vector = null;
    this.drawMode = false;
    this.history_stack = {undo: [], redo: []};
    this.settings = this.sanitizeSettings(settings);
    this.element = $('#' + element_id);

    this.element.on('click', '.reset', this.reset.bind(this));
    this.element.on('click', '.add-vector', this.addElementFromList.bind(this));
    this.element.on('click', '.undo', this.undo.bind(this));
    this.element.on('click', '.redo', this.redo.bind(this));
    // Prevents default image drag and drop actions in some browsers.
    this.element.on('mousedown', '.jxgboard image', function(evt) { evt.preventDefault(); });

    this.render();
};

VectorDraw.prototype.sanitizeSettings = function(settings) {
    // Fill in defaults at top level of settings.
    var default_settings = {
        width: 550,
        height: 400,
        axis: false,
        background: null,
        snap_angle_increment: 0,
        bounding_box_size: 10,
        show_navigation: false,
        show_vector_properties: true,
        show_add_vector: true,
        add_vector_label: 'Add Selected Force',
        vector_properties_label: 'Vector Properties',
        vectors: [],
        points: [],
        expected_result: {},
        custom_checks: [],
        unit_vector_ratio: 1
    };
    _.defaults(settings, default_settings);
    var width_scale = settings.width / settings.height,
        box_size = settings.bounding_box_size;
    settings.bounding_box = [-box_size*width_scale, box_size, box_size*width_scale, -box_size]

    // Fill in defaults for vectors.
    var default_vector = {
        type: 'vector',
        render: false,
        length_factor: 1,
        length_units: '',
        base_angle: 0,
        fixed_length_and_orientation: false,
        fixed: false,
    };
    var default_vector_style = {
        pointSize: 1,
        pointColor: 'red',
        width: 4,
        color: "blue",
        label: null,
        labelColor: 'black'
    };
    settings.vectors.forEach(function(vector) {
        _.defaults(vector, default_vector);
        if (!_.has(vector, 'style')) {
            vector.style = {};
        }
        _.defaults(vector.style, default_vector_style);
    });

    // Fill in defaults for points.
    var default_point = {
        fixed: true,  // Default to true for backwards compatibility.
        render: true
    };
    var default_point_style = {
        size: 1,
        withLabel: false,
        color: 'pink',
        showInfoBox: false
    };
    settings.points.forEach(function(point) {
        _.defaults(point, default_point);
        if (!_.has(point, 'style')) {
            point.style = {};
        }
        _.defaults(point.style, default_point_style);
        point.style.name = point.name;
        point.style.fixed = point.fixed;
        point.style.strokeColor = point.style.color;
        point.style.fillColor = point.style.color;
        delete point.style.color;
    });

    return settings;
}

VectorDraw.prototype.template = _.template([
    '<div class="jxgboard" style="width:<%= width %>px; height:<%= height %>px;" />',
    '<div class="menu">',
    '    <div class="controls">',
    '        <select>',
    '        <% vectors.forEach(function(vec, idx) { %>',
    '            <option value="vector-<%= idx %>"><%= vec.description %></option>',
    '        <% }) %>',
    '        <% points.forEach(function(point, idx) { if (!point.fixed) { %>',
    '            <option value="point-<%= idx %>"><%= point.description %></option>',
    '        <% }}) %>',
    '        </select>',
    '        <% var addVectorClass = show_add_vector ? "" : "hidden" %>',
    '        <button class="add-vector <%= addVectorClass%>">',
    '           <%= add_vector_label %>',
    '        </button>',
    '        <button class="reset">Reset</button>',
    '        <button class="undo" title="Undo"><span class="fa fa-undo" /></button>',
    '        <button class="redo" title="redo"><span class="fa fa-repeat" /></button>',
    '    </div>',
    '    <% if (show_vector_properties) { %>',
    '      <div class="vector-properties">',
    '        <h3><%= vector_properties_label %></h3>',
    '        <div class="vector-prop-name">',
    '          name: <span class="value vector-prop-bold">-</span>',
    '        </div>',
    '        <div class="vector-prop-length">',
    '          length: <span class="value">-</span>',
    '        </div>',
    '        <div class="vector-prop-angle">',
    '          angle: <span class="value">-</span>&deg;',
    '        </div>',
    '        <div class="vector-prop-slope">',
    '          slope: <span class="value">-</span>',
    '        </div>',
    '      </div>',
    '    <% } %>',
    '</div>'
].join('\n'));

VectorDraw.prototype.render = function() {
    this.element.html(this.template(this.settings));
    // Assign the jxgboard element a random unique ID,
    // because JXG.JSXGraph.initBoard needs it.
    this.element.find('.jxgboard').prop('id', _.uniqueId('jxgboard'));
    this.createBoard();
};

VectorDraw.prototype.createBoard = function() {
    var id = this.element.find('.jxgboard').prop('id'),
        self = this;

    this.board = JXG.JSXGraph.initBoard(id, {
        keepaspectratio: true,
        boundingbox: this.settings.bounding_box,
        axis: this.settings.axis,
        showCopyright: false,
        showNavigation: this.settings.show_navigation
    });

    function getImageRatio(bg, callback) {
        $('<img/>').attr('src', bg.src).load(function(){
            //technically it's inverse of ratio, but we need it to calculate height
            var ratio = this.height / this.width;
            callback(bg, ratio);
        });
    }

    function drawBackground(bg, ratio) {
        var height = (bg.height) ? bg.height : bg.width * ratio;
        var coords = (bg.coords) ? bg.coords : [-bg.width/2, -height/2];
        self.board.create('image', [bg.src, coords, [bg.width, height]], {fixed: true});
    }

    if (this.settings.background) {
        if (this.settings.background.height) {
            drawBackground(this.settings.background);
        }
        else {
            getImageRatio(this.settings.background, drawBackground);
        }
    }

    this.settings.points.forEach(function(point, idx) {
        if (point.render) {
            this.renderPoint(idx);
        }
    }, this);

    this.settings.vectors.forEach(function(vec, idx) {
        if (vec.render) {
            this.renderVector(idx);
        }
    }, this);

    this.board.on('down', this.onBoardDown.bind(this));
    this.board.on('move', this.onBoardMove.bind(this));
    this.board.on('up', this.onBoardUp.bind(this));
};

VectorDraw.prototype.renderPoint = function(idx, coords) {
    var point = this.settings.points[idx];
    var coords = coords || point.coords;
    var board_object = this.board.elementsByName[point.name];
    if (board_object) {
        // If the point is already rendered, only update its coordinates.
        board_object.setPosition(JXG.COORDS_BY_USER, coords);
        return;
    }
    this.board.create('point', coords, point.style);
    if (!point.fixed) {
        // Disable the <option> element corresponding to point.
        var option = this.getMenuOption('point', idx);
        option.prop('disabled', true).prop('selected', false);
    }
}

VectorDraw.prototype.removePoint = function(idx) {
    var point = this.settings.points[idx];
    var object = this.board.elementsByName[point.name];
    if (object) {
        this.board.removeAncestors(object);
        // Enable the <option> element corresponding to point.
        var option = this.getMenuOption('point', idx);
        option.prop('disabled', false);
    }
};

VectorDraw.prototype.getVectorCoordinates = function(vec) {
    var coords = vec.coords;
    if (!coords) {
        var tail = vec.tail || [0, 0];
        var length = 'length' in vec ? vec.length : 5;
        var angle = 'angle' in vec ? vec.angle : 30;
        var radians = angle * Math.PI / 180;
        var tip = [
            tail[0] + Math.cos(radians) * length,
            tail[1] + Math.sin(radians) * length
        ];
        coords = [tail, tip];
    }
    return coords;
};

VectorDraw.prototype.getVectorStyle = function(vec) {
    //width, color, size of control point, label (which should be a JSXGraph option)
    var default_style = {
        pointSize: 1,
        pointColor: 'red',
        width: 4,
        color: "blue",
        label: null,
        labelColor: 'black'
    };

    return _.extend(default_style, vec.style);
};

VectorDraw.prototype.renderVector = function(idx, coords) {
    var vec = this.settings.vectors[idx];
    coords = coords || this.getVectorCoordinates(vec);

    // If this vector is already rendered, only update its coordinates.
    var board_object = this.board.elementsByName[vec.name];
    if (board_object) {
        board_object.point1.setPosition(JXG.COORDS_BY_USER, coords[0]);
        board_object.point2.setPosition(JXG.COORDS_BY_USER, coords[1]);
        return;
    }

    var style = vec.style;

    var tail = this.board.create('point', coords[0], {
        name: vec.name,
        size: (vec.type === 'arrow' | vec.type === 'vector') ? -1 : style.pointSize,
        fillColor: style.pointColor,
        strokeColor: style.pointColor,
        withLabel: false,
        fixed: (vec.type === 'arrow' | vec.type === 'vector'),
        showInfoBox: false
    });
    var tip = this.board.create('point', coords[1], {
        name: vec.name,
        size: style.pointSize,
        fillColor: style.pointColor,
        strokeColor: style.pointColor,
        withLabel: false,
        showInfoBox: false
    });
    if (vec.fixed_length_and_orientation){
        tip.hideElement();
    }
    var labelPoint  = this.board.create('point', [function(){return tip.X()}, function(){return tip.Y()}], {
        name: style.label || vec.name,
        withLabel: true,
        size:-1,
        showInfoBox: false
    })
    // Not sure why, but including labelColor in attributes above doesn't work,
    // it only works when set explicitly with setAttribute.
    labelPoint.setAttribute({labelColor: style.labelColor});

    var line_type = (vec.type === 'vector') ? 'arrow' : vec.type;
    var line = this.board.create(line_type, [tail, tip], {
        name: vec.name,
        strokeWidth: style.width,
        strokeColor: style.color
    });

    if (vec.fixed) {
        line.setAttribute({fixed:true, highlight:false});
        tail.hideElement();
        tip.hideElement();
    }

    labelPoint.label.setAttribute({fontsize: 18, highlightStrokeColor: 'black'});

    // Disable the <option> element corresponding to vector.
    var option = this.getMenuOption('vector', idx);
    option.prop('disabled', true).prop('selected', false);

    return line;
};

VectorDraw.prototype.removeVector = function(idx) {
    var vec = this.settings.vectors[idx];
    var object = this.board.elementsByName[vec.name];
    if (object) {
        this.board.removeAncestors(object);
        // Enable the <option> element corresponding to vector.
        var option = this.getMenuOption('vector', idx);
        option.prop('disabled', false);
    }
};

VectorDraw.prototype.getMenuOption = function(type, idx) {
    return this.element.find('.menu option[value=' + type + '-' + idx + ']');
};

VectorDraw.prototype.getSelectedElement = function() {
    var selector = this.element.find('.menu select').val();
    if (selector) {
        selector = selector.split('-');
        return {
            type: selector[0],
            idx: parseInt(selector[1])
        }
    }
    return {};
};

VectorDraw.prototype.addElementFromList = function() {
    this.pushHistory();
    var selected = this.getSelectedElement();
    if (selected.type === 'vector') {
        this.updateVectorProperties(this.renderVector(selected.idx));
    } else {
        this.renderPoint(selected.idx);
    }
};

VectorDraw.prototype.reset = function() {
    this.pushHistory();
    JXG.JSXGraph.freeBoard(this.board);
    this.render();
};

VectorDraw.prototype.pushHistory = function() {
    var state = this.getState();
    var previous_state = _.last(this.history_stack.undo);
    if (!_.isEqual(state, previous_state)) {
      this.history_stack.undo.push(state);
      this.history_stack.redo = [];
    }
};

VectorDraw.prototype.undo = function() {
    var curr_state = this.getState();
    var undo_state = this.history_stack.undo.pop();
    if (undo_state && !_.isEqual(undo_state, curr_state)) {
        this.history_stack.redo.push(curr_state);
        this.setState(undo_state);
    }
};

VectorDraw.prototype.redo = function() {
    var state = this.history_stack.redo.pop();
    if (state) {
        this.history_stack.undo.push(this.getState());
        this.setState(state);
    }
};

VectorDraw.prototype.getMouseCoords = function(evt) {
    var i = evt[JXG.touchProperty] ? 0 : undefined;
    var c_pos = this.board.getCoordsTopLeftCorner(evt, i);
    var abs_pos = JXG.getPosition(evt, i);
    var dx = abs_pos[0] - c_pos[0];
    var dy = abs_pos[1] - c_pos[1];

    return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], this.board);
};

VectorDraw.prototype.getVectorForObject = function(obj) {
    if (obj instanceof JXG.Line) {
        return obj;
    }
    if (obj instanceof JXG.Text) {
        return this.getVectorForObject(obj.element);
    }
    if (obj instanceof JXG.Point) {
        return _.find(obj.descendants, function (d) { return (d instanceof JXG.Line); });
    }
    return null;
};

VectorDraw.prototype.getVectorSettingsByName = function(name) {
    return _.find(this.settings.vectors, function(vec) {
        return vec.name === name;
    });
};

VectorDraw.prototype.updateVectorProperties = function(vector) {
    var vec_settings = this.getVectorSettingsByName(vector.name);
    var x1 = vector.point1.X(),
        y1 = vector.point1.Y(),
        x2 = vector.point2.X(),
        y2 = vector.point2.Y();
    var length = vec_settings.length_factor * Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
    var slope = (y2-y1)/(x2-x1);
    var angle = ((Math.atan2(y2-y1, x2-x1)/Math.PI*180) - vec_settings.base_angle) % 360;
    if (angle < 0) {
        angle += 360;
    }
    $('.vector-prop-name .value', this.element).html(vector.point2.name); // labels are stored as point2 names
    $('.vector-prop-angle .value', this.element).html(angle.toFixed(2));
    if (vector.elType !== "line") {
        $('.vector-prop-length', this.element).show();
        $('.vector-prop-length .value', this.element).html(length.toFixed(2) + ' ' + vec_settings.length_units);
        $('.vector-prop-slope', this.element).hide();
    }
    else {
        $('.vector-prop-length', this.element).hide();
        if (this.settings.show_slope_for_lines) {
            $('.vector-prop-slope', this.element).show();
            $('.vector-prop-slope .value', this.element).html(slope.toFixed(2));
        }
    }
};

VectorDraw.prototype.isVectorTailDraggable = function(vector) {
    return vector.elType !== 'arrow';
};

VectorDraw.prototype.canCreateVectorOnTopOf = function(el) {
    // If the user is trying to drag the arrow of an existing vector, we should not create a new vector.
    if (el instanceof JXG.Line) {
        return false;
    }
    // If this is tip/tail of a vector, it's going to have a descendant Line - we should not create a new vector
    // when over the tip. Creating on top of the tail is allowed for plain vectors but not for segments.
    // If it doesn't have a descendant Line, it's a point from settings.points - creating a new vector is allowed.
    if (el instanceof JXG.Point) {
        var vector = this.getVectorForObject(el);
        if (!vector) {
            return el.getProperty('fixed');
        } else if (el === vector.point1 && !this.isVectorTailDraggable(vector)) {
            return true;
        } else {
            return false;
        }
    }
    return true;
};

VectorDraw.prototype.objectsUnderMouse = function(){
    var targetObjects = [];
    var highlightedObjects = this.board.highlightedObjects
    var keys = Object.keys(highlightedObjects);
    for (var i = 0; i < keys.length; i++) {
        targetObjects.push( highlightedObjects[keys[i]] );
    }
    return targetObjects
}

VectorDraw.prototype.preventDefault = function(e) {
    // for disabling scroll http://stackoverflow.com/a/4770179/2747370
    e = e || window.event;
    if (e.preventDefault){
        e.preventDefault();
    }
    e.returnValue = false;  
}

VectorDraw.prototype.preventDefaultForScrollKeys = function(e) {
    // for disabling scroll http://stackoverflow.com/a/4770179/2747370
    var keys = {37: 1, 38: 1, 39: 1, 40: 1};
    if (keys[e.keyCode]) {
        this.preventDefault(e);
        return false;
    }
}

VectorDraw.prototype.disableScroll = function() {
    // for disabling scroll http://stackoverflow.com/a/4770179/2747370
    var preventDefault = this.preventDefault;
    var preventDefaultForScrollKeys = this.preventDefaultForScrollKeys;
    if (window.addEventListener){ // older FF
        window.addEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onwheel = preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
    window.ontouchmove  = preventDefault; // mobile
    document.onkeydown  = preventDefaultForScrollKeys;
}   

VectorDraw.prototype.enableScroll = function() {
    // for disabling scroll http://stackoverflow.com/a/4770179/2747370
    var preventDefault = this.preventDefault;
    var preventDefaultForScrollKeys = this.preventDefaultForScrollKeys;
    if (window.removeEventListener){
        window.removeEventListener('DOMMouseScroll', preventDefault, false);
    }
    window.onmousewheel = document.onmousewheel = null; 
    window.onwheel = null; 
    window.ontouchmove = null;  
    document.onkeydown = null;  
}

VectorDraw.prototype.snapAngle = function(vector){
    if (this.settings.snap_angle_increment === 0){
        return
    }
    
    if (vector.point2.lastDragTime > vector.point1.lastDragTime){
        // p1 is always the anchor; p2 can move during snap
        var p1 = vector.point1;
        var p2 = vector.point2;
    } else {
        var p1 = vector.point2;
        var p2 = vector.point1;
    }
    
    // Calculate new position for p2
    var x1 = p1.X(),
        y1 = p1.Y(),
        x2 = p2.X(),
        y2 = p2.Y();
    var length = Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) );
    var angle = Math.atan2(y2-y1, x2-x1)/Math.PI*180;
    angle = Math.round(angle/this.settings.snap_angle_increment) * this.settings.snap_angle_increment;
    var angle_rad = angle*Math.PI/180;
    
    // update p2
    x2 = x1 + length*Math.cos(angle_rad);
    y2 = y1 + length*Math.sin(angle_rad);
    
    p2.setPosition(JXG.COORDS_BY_USER,[x2,y2]);
    this.board.fullUpdate();
    this.updateVectorProperties(vector);
}

VectorDraw.prototype.onBoardDown = function(evt) {
    this.pushHistory();
    // Can't create a vector if none is selected from the list.
    var selected = this.getSelectedElement();
    var coords = this.getMouseCoords(evt);
    var targetObjects = this.objectsUnderMouse(coords);
    if (!_.isEmpty(selected) && (!targetObjects || _.all(targetObjects, this.canCreateVectorOnTopOf.bind(this)))) {
        var point_coords = [coords.usrCoords[1], coords.usrCoords[2]];
        if (selected.type === 'vector') {
            this.drawMode = true;
            this.disableScroll();
            this.dragged_vector = this.renderVector(selected.idx, [point_coords, point_coords]);
        } else {
            this.renderPoint(selected.idx, point_coords);
        }
    }
    else {
        this.drawMode = false;
        var vectorPoint = _.find(targetObjects, this.getVectorForObject.bind(this));
        if (vectorPoint) {
            this.dragged_vector = this.getVectorForObject(vectorPoint);
            this.dragged_vector.point1.setProperty({fixed: false});
            this.updateVectorProperties(this.dragged_vector);
        }
    }
};

VectorDraw.prototype.onBoardMove = function(evt) {
    if (this.drawMode) {
        var coords = this.getMouseCoords(evt);
        this.dragged_vector.point2.moveTo(coords.usrCoords);
    }
    if (this.dragged_vector) {
        this.updateVectorProperties(this.dragged_vector);
    }
};

VectorDraw.prototype.onBoardUp = function(evt) {
    this.enableScroll();
    this.drawMode = false;
    if (this.dragged_vector) {
        this.snapAngle(this.dragged_vector);
    }
    if (this.dragged_vector && !this.isVectorTailDraggable(this.dragged_vector)) {
        this.dragged_vector.point1.setProperty({fixed: true});
    }
    this.dragged_vector = null;
};

VectorDraw.prototype.getVectorCoords = function(name) {
    var object = this.board.elementsByName[name];
    if (object) {
        return {
            tail: [object.point1.X(), object.point1.Y()],
            tip: [object.point2.X(), object.point2.Y()]
        };
    }
};

VectorDraw.prototype.getState = function() {
    var vectors = {}, points = {};
    this.settings.vectors.forEach(function(vec) {
        var coords = this.getVectorCoords(vec.name);
        if (coords) {
            vectors[vec.name] = coords;
        }
    }, this);
    this.settings.points.forEach(function(point) {
        var obj = this.board.elementsByName[point.name];
        if (obj) {
            points[point.name] = [obj.X(), obj.Y()];
        }
    }, this);
    return {vectors: vectors, points: points};
};

VectorDraw.prototype.setState = function(state) {
    this.settings.vectors.forEach(function(vec, idx) {
        var vec_state = state.vectors[vec.name];
        if (vec_state) {
            this.renderVector(idx, [vec_state.tail, vec_state.tip]);
        } else {
            this.removeVector(idx);
        }
    }, this);
    this.settings.points.forEach(function(point, idx) {
        var point_state = state.points[point.name];
        if (point_state) {
            this.renderPoint(idx, point_state);
        } else {
            this.removePoint(idx);
        }
    }, this);
    this.board.update();
};


/////////////////////////////////////////////////////

var vectordraw = new VectorDraw('vectordraw', vectordraw_settings);

var getState = function() {
    var state = vectordraw.getState();
    return JSON.stringify(state);
};

var setState = function(serialized) {
    vectordraw.setState(JSON.parse(serialized));
};

var getInput = function() {
    var input = vectordraw.getState();

    // Transform the expected_result setting into a list of checks.
    var checks = [];

    _.each(vectordraw.settings.expected_result, function(answer, name) {
        var presence_check = {vector: name, check: 'presence'};
        if ('presence_errmsg' in answer) {
            presence_check.errmsg = answer.presence_errmsg;
        }
        checks.push(presence_check);

        [
            'min_length', 'tail', 'tail_x', 'tail_y', 'tip', 'tip_x', 'tip_y', 'coords',
            'length', 'angle', 'segment_angle', 'segment_coords', 'points_on_line'
        ].forEach(function(prop) {
            if (prop in answer) {
                var check = {vector: name, check: prop, expected: answer[prop]};
                if (prop + '_tolerance' in answer) {
                    check.tolerance = answer[prop + '_tolerance'];
                }
                if (prop + '_errmsg' in answer) {
                    check.errmsg = answer[prop + '_errmsg']
                }
                checks.push(check);
            }
        });
    });

    input.checks = checks.concat(vectordraw.settings.custom_checks);

    return JSON.stringify(input);
};
