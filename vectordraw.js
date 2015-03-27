'use strict';

var VectorDraw = function(element_id, settings) {
    var default_settings = {
        width: 500,
        height: 350,
        axis: false,
        background: null,
        bounding_box: [-10, 10, 10, -10],
        vectors: [],
        points: []
    };

    this.board = null;
    this.dragged_vector = null;
    this.history_stack = {undo: [], redo: []};
    this.settings = _.extend(default_settings, settings);
    this.element = $('#' + element_id);

    this.element.on('click', '.reset', this.reset.bind(this));
    this.element.on('click', '.add-vector', this.addVectorFromList.bind(this));
    this.element.on('click', '.undo', this.undo.bind(this));
    this.element.on('click', '.redo', this.redo.bind(this));
    // Prevents default image drag and drop actions in some browsers.
    this.element.on('mousedown', '.jxgboard image', function(evt) { evt.preventDefault(); });

    this.render();
};

VectorDraw.prototype.template = _.template([
    '<div class="jxgboard" style="width:<%= width %>px; height:<%= height %>px;" />',
    '<div class="menu">',
    '    <div class="controls">',
    '        <select>',
    '        <% vectors.forEach(function(vec, idx) { %>',
    '            <option value="<%= idx %>"><%= vec.description %></option>',
    '        <% }) %>',
    '        </select>',
    '        <button class="add-vector">Add Selected Force</button>',
    '        <button class="reset">Reset</button>',
    '        <button class="undo" title="Undo"><span class="fa fa-undo" /></button>',
    '        <button class="redo" title="redo"><span class="fa fa-repeat" /></button>',
    '    </div>',
    '    <div class="vector-properties">',
    '      <h3>Vector Properties</h3>',
    '      <div>',
    '        length: <span class="value">3.4</span>',
    '      </div>',
    '      <div>',
    '        angle: <span class="value">74&deg;</span>',
    '      </div>',
    '    </div>',
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
    var id = this.element.find('.jxgboard').prop('id');

    this.board = JXG.JSXGraph.initBoard(id, {
        boundingbox: this.settings.bounding_box,
        axis: this.settings.axis,
        showCopyright: false
    });

    if (this.settings.background) {
        var bg = this.settings.background;
        this.board.create('image', [bg.src, bg.coords, [bg.width, bg.height]], {fixed: true});
    }

    this.settings.points.forEach(function(point) {
        var opts = {
            size: 1,
            fixed: true,
            name: point.name,
            withLabel: false,
            strokeColor: 'pink',
            fillColor: 'pink'
        };
        this.board.create('point', point.coords, opts);
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

    var tail = this.board.create('point', coords[0], {
        size: 0.5,
        name: vec.name,
        withLabel: false
    });
    var tip = this.board.create('point', coords[1], {
        size: 1,
        name: vec.name
    });
    var arrow = this.board.create('arrow', [tail, tip], {
        name: vec.name,
        strokeWidth: 3
    });

    // Disable the <option> element corresponding to vector.
    var option = this.element.find('.menu option[value=' + idx + ']');
    option.prop('disabled', true).prop('selected', false);

    return arrow;
};

VectorDraw.prototype.removeVector = function(idx) {
    var vec = this.settings.vectors[idx];
    var object = this.board.elementsByName[vec.name];
    if (object) {
        this.board.removeAncestors(object);
        // Enable the <option> element corresponding to vector.
        var option = this.element.find('.menu option[value=' + idx + ']');
        option.prop('disabled', false);
    }
};

VectorDraw.prototype.addVectorFromList = function() {
    this.pushHistory();
    var idx = this.element.find('.menu select').val();
    this.renderVector(idx);
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

VectorDraw.prototype.canCreateVectorAtPoint = function(coords) {
    for (var eid in this.board.objects) {
        var el = this.board.objects[eid];
        if (el.hasPoint(coords.scrCoords[1], coords.scrCoords[2])) {
            // If the user is trying to drag the arrow of an existing vector,
            // we should not create a new vector.
            if (el instanceof JXG.Line) {
                return false;
            }
            // If the user is trying to draw the tip or tail of existing vector,
            // we should not crate a new vector.
            if (el instanceof JXG.Point) {
                // If this is tip/tail of a vector, it's going to have a descendant Line
                // in which case we should not create a new vector.
                // If it doesn't have a descendant Line, it's just a point from settings.points,
                // which means creating a new vector is allowed.
                if (_.some(el.descendants, function(d) { return (d instanceof JXG.Line); })) {
                    return false;
                }
            }
        }
    }
    return true;
};

VectorDraw.prototype.onBoardDown = function(evt) {
    this.pushHistory();
    // Can't create a vector if none is selected from the list.
    var vec_idx = this.element.find('.menu select').val();
    if (!vec_idx) {
        return;
    }
    var coords = this.getMouseCoords(evt);
    if (this.canCreateVectorAtPoint(coords)) {
        var point_coords = [coords.usrCoords[1], coords.usrCoords[2]];
        this.dragged_vector = this.renderVector(vec_idx, [point_coords, point_coords]);
    }
};

VectorDraw.prototype.onBoardMove = function(evt) {
    if (!this.dragged_vector) {
        return;
    }
    var coords = this.getMouseCoords(evt);
    this.dragged_vector.point2.moveTo(coords.usrCoords);
};

VectorDraw.prototype.onBoardUp = function(evt) {
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
    var vectors = {};
    this.settings.vectors.forEach(function(vec) {
        var coords = this.getVectorCoords(vec.name);
        if (coords) {
            vectors[vec.name] = coords;
        }
    }, this);
    return {vectors: vectors};
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
    var points = {};
    vectordraw.settings.points.forEach(function(point) {
        points[point.name] = point;
    });
    input.points = points;
    return JSON.stringify(input);
};
