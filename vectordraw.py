# The contents of this file need to be pasted into the loncapa/python
# script tag of the problem XML definition - see api-example.xml for
# an example.

class Point(object):
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Vector(object):
    def __init__(self, x1, y1, x2, y2):
        self.tail = Point(x1, y1)
        self.tip = Point(x2, y2)
        self.length = math.hypot(x2 - x1, y2 - y1)
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        if angle < 0:
            angle += 360
        self.angle = angle

class Grader(object):
    def __init__(self, answer, checks, success_message='Test passed'):
        self.answer = answer
        self.checks = checks
        self.success_message = success_message

    def grade(self):
        for check in self.checks:
            result = check(self._get_vectors(), self._get_points())
            if result:
                return {'ok': False, 'msg': result}
        return {'ok': True, 'msg': self.success_message}

    def _get_vectors(self):
        vectors = {}
        for name, props in self.answer['vectors'].iteritems():
            tail = props['tail']
            tip = props['tip']
            vectors[name] = Vector(tail[0], tail[1], tip[0], tip[1])
        return vectors

    def _get_points(self):
        points = {}
        for name, props in self.answer['points'].iteritems():
            coords = props['coords']
            points[name] = Point(coords[0], coords[1])
        return points

answer = json.loads(json.loads(ans)['answer'])
grader = Grader(answer, checks, success_message)

return grader.grade()
