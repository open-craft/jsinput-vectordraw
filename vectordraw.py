# The contents of this file need to be pasted into the loncapa/python
# script tag of the problem XML definition - see api-example.xml for
# an example.


## Built-in check functions

def check_presence(check, vectors):
    if check['vector'] not in vectors:
        return 'You need to use the {} vector.'.format(check['vector'])

def check_tail(check, vectors):
    vec = vectors[check['vector']]
    tolerance = check.get('tolerance', 1.0)
    expected = check['expected']
    dist = math.hypot(expected[0] - vec.tail.x, expected[1] - vec.tail.y)
    if dist > tolerance:
        return 'Vector {} does not start at correct point.'.format(vec.name)

def check_tip(check, vectors):
    vec = vectors[check['vector']]
    tolerance = check.get('tolerance', 1.0)
    expected = check['expected']
    dist = math.hypot(expected[0] - vec.tip.x, expected[1] - vec.tip.y)
    if dist > tolerance:
        return 'Vector {} does not end at correct point.'.format(vec.name)

def check_length(check, vectors):
    vec = vectors[check['vector']]
    tolerance = check.get('tolerance', 1.0)
    if abs(vec.length - check['expected']) > tolerance:
        return 'The length of {} is incorrect. Your length: {:.1f}'.format(vec.name, vec.length)

def check_angle(check, vectors):
    vec = vectors[check['vector']]
    tolerance = check.get('tolerance', 2.0)
    if abs(vec.angle - check['expected']) > tolerance:
        return 'The angle of {} is incorrect. Your angle: {:.1f}'.format(vec.name, vec.angle)


class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Vector(object):
    def __init__(self, name, x1, y1, x2, y2):
        self.name = name
        self.tail = Point(x1, y1)
        self.tip = Point(x2, y2)
        self.length = math.hypot(x2 - x1, y2 - y1)
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        if angle < 0:
            angle += 360
        self.angle = angle

class Grader(object):
    check_registry = {
        'presence': check_presence,
        'tail': check_tail,
        'tip': check_tip,
        'length': check_length,
        'angle': check_angle,
    }

    def __init__(self, answer, custom_checks, success_message='Test passed'):
        self.answer = answer
        self.check_registry.update(custom_checks)
        self.success_message = success_message

    def grade(self):
        for check in self.answer['checks']:
            check_fn = self.check_registry[check['check']]
            result = check_fn(check, self._get_vectors())
            if result:
                return {'ok': False, 'msg': result}

        return {'ok': True, 'msg': self.success_message}

    def _get_vectors(self):
        vectors = {}
        for name, props in self.answer['vectors'].iteritems():
            tail = props['tail']
            tip = props['tip']
            vectors[name] = Vector(name, tail[0], tail[1], tip[0], tip[1])
        return vectors

answer = json.loads(json.loads(ans)['answer'])
grader = Grader(answer, custom_checks, success_message)

return grader.grade()
