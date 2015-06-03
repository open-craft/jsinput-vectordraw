import unittest
import vectordraw as vd


class VectorDrawTest(unittest.TestCase):

    def __init__(self, *args, **kwargs):
        super(VectorDrawTest, self).__init__(*args, **kwargs)
        # Alias assertions to make tests read better.
        self.assertPasses = self.assertIsNone
        self.assertFails = self.assertEquals

    # Helpers

    def check(self, expected=None, tolerance=1.0, vector='vec', errmsg=None):
        check = {'vector': vector, 'expected': expected, 'tolerance': tolerance}
        if errmsg:
            check['errmsg'] = errmsg
        return check

    def vector(self, x1=0, y1=0, x2=1, y2=1, name='vec'):
        return vd.Vector(name, x1, y1, x2, y2)

    # Test built-in checks

    def test_check_presence(self):
        errmsg = 'You need to use the othervec vector.'
        vectors = {'myvec': self.vector(name='myvec')}
        self.assertPasses(vd.check_presence(self.check(vector='myvec'), vectors))
        self.assertFails(vd.check_presence(self.check(vector='othervec'), vectors), errmsg)
        custom_errmsg = 'Use {name}, please!'
        self.assertFails(vd.check_presence(self.check(vector='vec X', errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec X'))

    def test_check_tail(self):
        errmsg = 'Vector vec does not start at correct point.'
        vectors = {'vec': self.vector(3, 3, 4, 4)}
        self.assertPasses(vd.check_tail(self.check([3, 3], 0), vectors))
        self.assertPasses(vd.check_tail(self.check([4, 4], 1.5), vectors))
        self.assertFails(vd.check_tail(self.check([3.1, 3], 0), vectors), errmsg)
        self.assertFails(vd.check_tail(self.check([4, 4], 1.0), vectors), errmsg)
        custom_errmsg = 'Bad start point: [{tail_x}, {tail_y}]'
        self.assertFails(vd.check_tail(self.check([1, 2], errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(tail_x=3, tail_y=3))

    def test_check_tip(self):
        errmsg = 'Vector vec does not end at correct point.'
        vectors = {'vec': self.vector(3, 3, 4, 4)}
        self.assertPasses(vd.check_tip(self.check([4, 4], 0), vectors))
        self.assertPasses(vd.check_tip(self.check([3, 3], 1.5), vectors))
        self.assertFails(vd.check_tip(self.check([4.1, 4], 0), vectors), errmsg)
        self.assertFails(vd.check_tip(self.check([3, 3], 1.0), vectors), errmsg)
        custom_errmsg = '{name} does not start at correct point.'
        self.assertFails(vd.check_tip(self.check([3, 3], errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec'))

    def test_check_tail_x(self):
        errmsg = 'Vector vec does not start at correct point.'
        vectors = {'vec': self.vector(3, 12, 4, 40)}
        self.assertPasses(vd.check_tail_x(self.check(3, 0), vectors))
        self.assertPasses(vd.check_tail_x(self.check(4, 1), vectors))
        self.assertFails(vd.check_tail_x(self.check(5, 0), vectors), errmsg)
        self.assertFails(vd.check_tail_x(self.check(5, 1.5), vectors), errmsg)
        custom_errmsg = 'Bad starting point for {name}.'
        self.assertFails(vd.check_tail_x(self.check(5, 1.5, errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec'))

    def test_check_tail_y(self):
        errmsg = 'Vector vec does not start at correct point.'
        vectors = {'vec': self.vector(3, 12, 4, 40)}
        self.assertPasses(vd.check_tail_y(self.check(12, 0), vectors))
        self.assertPasses(vd.check_tail_y(self.check(13, 1), vectors))
        self.assertFails(vd.check_tail_y(self.check(13, 0), vectors), errmsg)
        self.assertFails(vd.check_tail_y(self.check(10, 1.5), vectors), errmsg)
        custom_errmsg = 'Tail y should not be {tail_y:.1f}.'
        self.assertFails(vd.check_tail_y(self.check(10, 1.5, errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(tail_y=12))

    def test_check_tip_x(self):
        errmsg = 'Vector vec does not end at correct point.'
        vectors = {'vec': self.vector(3, 12, 4, 40)}
        self.assertPasses(vd.check_tip_x(self.check(4, 0), vectors))
        self.assertPasses(vd.check_tip_x(self.check(5, 1), vectors))
        self.assertFails(vd.check_tip_x(self.check(5, 0), vectors), errmsg)
        self.assertFails(vd.check_tip_x(self.check(2, 1.5), vectors), errmsg)
        custom_errmsg = 'Adjust the x tip coordinate.'
        self.assertFails(vd.check_tip_x(self.check(2, 1.5, errmsg=custom_errmsg), vectors),
                         custom_errmsg)

    def test_check_tip_y(self):
        errmsg = 'Vector vec does not end at correct point.'
        vectors = {'vec': self.vector(3, 12, 4, 40)}
        self.assertPasses(vd.check_tip_y(self.check(40, 0), vectors))
        self.assertPasses(vd.check_tip_y(self.check(33, 10), vectors))
        self.assertFails(vd.check_tip_y(self.check(41, 0), vectors), errmsg)
        self.assertFails(vd.check_tip_y(self.check(29, 10), vectors), errmsg)
        custom_errmsg = 'Adjust the y tip coordinate of {name}.'
        self.assertFails(vd.check_tip_y(self.check(29, 10, errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec'))

    def test_check_coords(self):
        errmsg = 'Vector vec coordinates are not correct.'
        vectors = {'vec': self.vector(1, 2, 3, 4)}
        self.assertPasses(vd.check_coords(self.check([[1, 2], [3, 4]], 0), vectors))
        self.assertPasses(vd.check_coords(self.check([[1, 3], [4, 4]], 2), vectors))
        self.assertPasses(vd.check_coords(self.check([['_', 2], [3, '_']], 0), vectors))
        self.assertPasses(vd.check_coords(self.check([[3, '_'], ['_', 5]], 2), vectors))
        self.assertPasses(vd.check_coords(self.check([['_', '_'], ['_', 3]], 2), vectors))
        self.assertPasses(vd.check_coords(self.check([['_', '_'], ['_', '_']], 0), vectors))
        self.assertFails(vd.check_coords(self.check([[2, 1], [3, 4]], 0), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([[3, 4], [1, 2]], 0), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([[1, 2], [4, 3]], 1), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([[3, 4], [1, 2]], 0), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([['_', 5], [3, 4]], 1), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([['_', 2], [1, '_']], 1), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([['_', 4], [2, '_']], 1), vectors), errmsg)
        self.assertFails(vd.check_coords(self.check([['_', 4], ['_', '_']], 1), vectors), errmsg)
        custom_errmsg = 'Wrong coordinates: [{tail_x:.1f},{tail_y:.1f}, {tip_x:.1f},{tip_y:.1f}]'
        self.assertFails(vd.check_coords(self.check([['_', '_'], ['_', -4]], errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(tail_x=1, tail_y=2, tip_x=3, tip_y=4))

    def test_check_segment_coords(self):
        errmsg = 'Segment vec coordinates are not correct.'
        vectors = {'vec': self.vector(1, 2, 3, 4)}
        self.assertPasses(vd.check_segment_coords(self.check([[1, 3], [4, 4]], 2), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([[4, 4], [1, 3]], 2), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', 2], [3, '_']], 0), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([[3, '_'], ['_', 2]], 0), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([[3, '_'], ['_', 5]], 2), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', 5], [3, '_']], 2), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', '_'], ['_', 3]], 2), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', '_'], ['_', '_']], 0), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([[1, 2], [3, 4]], 0), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([[3, 4], [1, 2]], 0), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', 4], ['_', '_']], 1), vectors))
        self.assertPasses(vd.check_segment_coords(self.check([['_', 4], [2, '_']], 1), vectors))
        self.assertFails(vd.check_segment_coords(self.check([[2, 1], [3, 4]], 0), vectors), errmsg)
        self.assertFails(vd.check_segment_coords(self.check([[-1, -2], [-3, -4]], 0), vectors), errmsg)
        self.assertFails(vd.check_segment_coords(self.check([[1, 2], [4, 3]], 1), vectors), errmsg)
        self.assertFails(vd.check_segment_coords(self.check([['_', 5], [3, 4]], 1), vectors), errmsg)
        self.assertFails(vd.check_segment_coords(self.check([['_', 2], [1, '_']], 1), vectors), errmsg)
        self.assertFails(vd.check_segment_coords(self.check([['_', '_'], ['_', 5.5]], 1), vectors), errmsg)
        custom_errmsg = 'Coordinates of {name} are wrong!'
        self.assertFails(vd.check_segment_coords(self.check([['_', '_'], ['_', 5.5]], errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec'))

    def test_check_length(self):
        errmsg = 'The length of vec is incorrect. Your length: 5.0'
        vectors = {'vec': self.vector(0, 0, 3, 4)}
        self.assertPasses(vd.check_length(self.check(5, 0), vectors))
        self.assertPasses(vd.check_length(self.check(7, 2.5), vectors))
        self.assertFails(vd.check_length(self.check(4.5, 0), vectors), errmsg)
        self.assertFails(vd.check_length(self.check(5.5, 0.25), vectors), errmsg)
        custom_errmsg = 'Bad length of {length:.2f}'
        self.assertFails(vd.check_length(self.check(5.5, 0.25, errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(length=5.00))

    def test_check_angle(self):
        errmsg = 'The angle of vec is incorrect. Your angle: 45.0'
        vectors = {'vec': self.vector(1, 1, 5, 5)}
        self.assertPasses(vd.check_angle(self.check(45, 0.1), vectors))
        self.assertPasses(vd.check_angle(self.check(-315, 0.1), vectors))
        self.assertPasses(vd.check_angle(self.check(405, 0.1), vectors))
        self.assertPasses(vd.check_angle(self.check(-5, 55), vectors))
        self.assertPasses(vd.check_angle(self.check(42, 5), vectors))
        self.assertFails(vd.check_angle(self.check(315, 0.1), vectors), errmsg)
        self.assertFails(vd.check_angle(self.check(30, 9), vectors), errmsg)
        custom_errmsg = 'Adjust angle of {name}. Currently: {angle:.0f}.'
        self.assertFails(vd.check_angle(self.check(30, 9, errmsg=custom_errmsg), vectors),
                         custom_errmsg.format(name='vec', angle=45.0))

    def test_check_segment_angle(self):
        errmsg = 'The angle of vec is incorrect. Your angle: 45.0'
        vectors = {'vec': self.vector(1, 1, 5, 5)}
        self.assertPasses(vd.check_segment_angle(self.check(45, 0.1), vectors))
        self.assertPasses(vd.check_segment_angle(self.check(-315, 0.1), vectors))
        self.assertPasses(vd.check_segment_angle(self.check(405, 0.1), vectors))
        self.assertPasses(vd.check_segment_angle(self.check(42, 5), vectors))
        self.assertFails(vd.check_segment_angle(self.check(-405, 0.1), vectors), errmsg)
        self.assertFails(vd.check_segment_angle(self.check(315, 0.1), vectors), errmsg)
        self.assertFails(vd.check_segment_angle(self.check(-45, 9), vectors), errmsg)
        custom_errmsg = 'Segment angle is incorrect.'
        self.assertFails(vd.check_segment_angle(self.check(-45, 9, errmsg=custom_errmsg), vectors),
                         custom_errmsg)


if __name__ == '__main__':
    unittest.main()
