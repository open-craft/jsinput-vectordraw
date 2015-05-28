# jsinput-vectordraw

Vector drawing exercises with JSInput.

## Installation

* Upload `vectordraw.js` and `vectordraw.css` to the *Files* section
  in the Studio.
* Choose one of the problems from the `Notes_and_Examples` directory,
  for example `2_boxIncline_multiVector`.
* Open the `2_boxIncline.html` file and change the lines that contain
  `/c4x/DavidsonNext/Ann101/` so that the URLs point to your course
  locations (the `DavidstonNext/Ann101` part needs to be replaced with
  your institution/course codes).
* Upload *2_boxIncline.html* and `box_on_incline.png` files to the
  *Files* section in the Studio.
* Add a new *Blank Common Problem* component to a unit in the Studio.
* Click *Edit* and switch to *Advanced Editor*.
* Paste `2_boxIncline.xml` content into the advanced editor, save, and
  publish.

## Custom Exercises

### Problem Definition

To create a custom exercise, you will need to create a new HTML file
with some boilerplate and the problem definition. You can base the
HTML file on `api-example.html` located in the root folder of this
repository.

The problem is defined in the `vectordraw_settings` object. It
supports these properties:

* `width`: The width of the board in pixels (defaults to `550`).
* `height`: The height of the board in pixels (defaults to `400`).
* `bounding_box_size`: Defines the bounding box height of the graph
  area. The bounding box width is calculated from the width/height
  ratio (defaults to `10`).
* `background`: Should be an objects containing the image `src`, for
  example `'/c4x/edX/JS101/asset/simple_car.png'`, and at least one of
  `width` or `height`.
* `vectors`: An object that defines all of the vectors used in the
  problem. More info below.
* `points`: Optional array of points to be drawn on the board. More
  info below.
* `expected_result`: The expected state of vectors after the user
  successfully solves the problem. The data given here is used for
  grading. More info below.
* `custom_checks`: An array of custom checks used for grading. This is
  needed when the grading is more complex and can't be defined in
  terms of `expected_result` only. More info below.
* `axis`: Show the graph axis (defaults to `false`).
* `show_navigation`: Show navigation arrows and zooom controls
  (defaults to `false`).
* `show_vector_properties`: Show the vector properties box (defaults
  to `true`).
* `add_vector_label`: Sets the text displayed on the add-vector button
  (defaults to `'Add Selected Force'`).
* `vector_properties_label`: Sets the text of the vector property box
  label (defaults to `'Vector Properties'`).

#### vectors

The `vectors` setting defines the list of vectors that are used in the
problem. It is given as an array of entries where each entry
represents an individual vector.

These are the supported vector properties:

* `name`: The name/id of the vector. Used to identify the vector in
  checks. The name is displayed as a label next to the vector on the
  graph.
* `description`: Defines the text shown in the dropdown.
* `coords`: An array of two coordinates that define the position of
  tail and tip points. An alternative way to define the position of
  the vector is to use `tail`, `length`, and `angle`.
* `tail`: Coorrdinate of the tail point of the vector. Only used if
  `coords` is not given.
* `length`: The length of the vector. Only used if `coords` is not
  given.
* `angle`: The vector angle. The value should be between `0` and
  `360`. Only used if `coords` is not given.
* `render`: Whether this vector should be drawn on the board
  automatically, without the user having to add it from the dropdown.
  Defaults to `false`.
* `style`: Custom style properties. Supports the following options:
  `label`, `width`, `color`, `pointSize`, `pointColor`.
* `type`: Supported values are `"vector"` (default) and
  `"segment"`. When set to `"segment"`, the vector is drawn without
  the arrow.

#### points

The `points` setting defines a list of points to be drawn on the
board. It is optional. Each point should be defined as an object with
`name` and `coords` properties.

#### expected_result

The `expected_result` setting defines vector properties for
grading. Vectors omitted from the `expected_result` setting are
ignored when grading. These are the supported properties:

* `tail`: Expected coordinates of the tail position, for example
  `[0, 1.5]`.
* `tip`: Expected coordinates of the tip position.
* `tail_x`, `tail_y`: Use these instead of `tail` when you are only
  interested in one of the coordinates, but not both.
* `tip_x`, `tip_y`: Use these instead of `tip` when you are only
  interested in one of the coordinates, but not both.
* `coords`: Combines `tail`, `tip`, `tail_x`, and `tail_y` as a single
  rule. The `'_'` character represents a coordinate with any value.
  Examples:
  * `[[1, 1], [2, 2]]` - same as a combination of `tail: `[1, 1]` and
    `tip: [2, 2]`.
  * `[['_', 3], [5, '_']]` - same as a combination of `tail_y: 3` and
    `tip_x: 5`.
* `length`: The expected length of the vector.
* `angle`: The expected vector angle.
* `segment_coords`: Just like `coords`, except that it is intented to
  be used with segments rather than vectors. Segments are not directed
  and there's no distinction between `tail` and `tip` points.  -
  `segment_coords: [[1, 2], [3, 4]]` is therefore equivalent to
  `segment_coords: [[3, 4], [1, 2]]`.
* `segment_angle`: Just like `angle`, but intended to be used with
  segments. Segments are not directed and `segment_angle: 0` is
  therefore equivalent to `segment_angle: 180`.

Every property is optional - you can check an arbitray list of
properties for each vector.

Each property check is performed with some default tolerance. You
can specify a custom tolerance for each check by specifying a
`<property>_tolerance` entry. For example, if you wanted to check the
the length of vector `N` is more than `8` but less than `12`, you
would specify the expected result like this:

    expected_result: {
        N: {length: 10, length_tolerance: 2}
    }

The `tail_tolerance` and `tip_tolerance` define the maximum allowed
distance of the vector tail/tip from the point specified by the
coordinates.

Each property check comes with a default error message that can be
overriden by specifying a `<property>_errmsg` entry. For example, if
you want the error message of a `tail_x` check to be something other
than the default `"Vector N does not start at the correct point"`, you
would specify the expected result like this:

    expected_result: {
        N: {tail_x: 5, tail_errmsg: 'N starts at a wrong location, try again.'}
    }

The custom error messages can use standard python `format`
placeholders for these vector properties: `name`, `tail_x`, `tail_y`,
`tip_x`, `tip_y`, `length`, `angle`. You can use them in a custom
error message like this:

    "The angle of your line is {angle:.1f}, which is not correct."

Presence checks are automatically performed when you specify an entry
for a vector in `expected_results`. To provide a custom message for
the presence check (defaults to `"You need to use the {name}
vector."`), use the `presence_errmsg` setting. Example:

    expected_result: {
        N: {length: 10, presence_errmsg: You must draw the normal force.'}
    }


#### cusotm_checks

The `custom_checks` property can be useful for more complex checks
that can't be specified using the `expected_result` entry alone.
When using custom checks, the pyton grading code for each custom check
needs to be defined in the problem XML. See the
`4_energyLevels_multiVector` for an example of a problem that uses
custom checks.

Each custom check should contain the `check` entry, which specifies
the name of the custom check and has to match the name of the check
function defined in pytho grading code.
All other entries are optional and will be passed to the custom
grading function unmodified, together with the list of vectors and
their state.

See `4_energyLevels.xml` for an example.
