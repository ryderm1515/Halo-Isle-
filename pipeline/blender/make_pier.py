"""Resort pier, one piece: 40 m boardwalk on posts with rope rails, lamp posts, a wide deck at the end with a blue-roofed gazebo,
a bench, a life ring and a ladder down to the water. +X runs out to sea, deck top at z=0. Run: python make_pier.py <public/assets dir>"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from kit import *
OUT = sys.argv[-1]; reset(); pi = math.pi; p = []
L, W, EX, EW = 40, 3.2, 9, 9      # walkway length/width, end deck length/width
# planks (alternating tone), stringers underneath
for i in range(int(L / .5)): p.append(box((.47, W, .09), (i * .5 + .25, 0, -.045), 'M_Wood' if i % 3 else 'M_WoodDark', .015, segs=1))
for i in range(int(EX / .5)): p.append(box((.47, EW, .09), (L + i * .5 + .25, 0, -.045), 'M_Wood' if i % 3 else 'M_WoodDark', .015, segs=1))
for sy in (-W / 2 + .2, W / 2 - .2): p.append(box((L, .16, .2), (L / 2, sy, -.19), 'M_WoodDark', .02, segs=1))
for sy in (-EW / 2 + .2, 0, EW / 2 - .2): p.append(box((EX, .16, .2), (L + EX / 2, sy, -.19), 'M_WoodDark', .02, segs=1))
def post(x, y, top=.95):
    return [cyl(.15, top + 4.2, (x, y, -4.2), 'M_WoodDark', 12), lathe([(.17, 0), (.19, .04), (.17, .1), (.1, .16), (0, .18)], 'M_Wood', 12, loc=(x, y, top)), cyl(.165, .07, (x, y, top - .22), 'M_Rope', 12)]
xs = [0, 5, 10, 15, 20, 25, 30, 35, 40]
for sy in (-W / 2, W / 2):
    for x in xs: p += post(x, sy)
    for a, b in zip(xs, xs[1:]):
        for h in (.78, .42): p.append(tube([(a, sy, h), (a + 1.25, sy, h - .13), (a + 2.5, sy, h - .18), (a + 3.75, sy, h - .13), (b, sy, h)], .035, 'M_Rope', 6))
# end deck: corner posts and ropes on three sides, a gap on the seaward side for the ladder
ends = [(L, -EW / 2), (L + EX / 2, -EW / 2), (L + EX, -EW / 2), (L + EX, -1.2), (L + EX, 1.2), (L + EX, EW / 2), (L + EX / 2, EW / 2), (L, EW / 2)]
for x, y in ends: p += post(x, y)
for (ax, ay), (bx, by) in [(ends[0], ends[1]), (ends[1], ends[2]), (ends[2], ends[3]), (ends[4], ends[5]), (ends[5], ends[6]), (ends[6], ends[7])]:
    for h in (.78, .42): p.append(tube([(ax, ay, h), ((ax + bx) / 2, (ay + by) / 2, h - .16), (bx, by, h)], .035, 'M_Rope', 6))
for y in (-EW / 2, EW / 2): p += [tube([(L, y, .78), (L, y * .36 / (EW / 2) * (EW / 2) / 1 if False else (W / 2 if y > 0 else -W / 2), .78)], .035, 'M_Rope', 6)]
# ladder
for sy in (-.35, .35): p.append(box((.08, .08, 3.2), (L + EX + .1, sy, -.9), 'M_Metal', .02))
for k in range(7): p.append(cyl(.03, .7, (L + EX + .1, -.35, .3 - k * .42), 'M_Metal', 6, rot=(-pi / 2, 0, 0)))
# gazebo: four posts, a hipped blue roof with a white trim and the mascot badge
gx, gy, gs, gh = L + 4.6, -1.6, 2.3, 2.5
for sx in (-1, 1):
    for sy in (-1, 1): p += [box((.2, .2, gh), (gx + sx * gs, gy + sy * gs, gh / 2), 'M_White', .03), box((.34, .34, .3), (gx + sx * gs, gy + sy * gs, .15), 'M_Wood', .04)]
p += [box((gs * 2 + .5, gs * 2 + .5, .14), (gx, gy, gh + .07), 'M_White', .04), lathe([(gs * 1.62, 0), (gs * 1.55, .1), (.5, 1.25), (.42, 1.36), (0, 1.4)], 'M_NavyBlue', 4, loc=(gx, gy, gh + .14), smooth=False), sphere(.16, (gx, gy, gh + 1.62), 'M_Yellow', segs=10, rings=8)]
p[-2].rotation_euler = (0, 0, pi / 4)
p.append(plane(1.5, .5, (gx, gy - gs * 1.05 - .28, gh + .62), 'M_Emblem', rot=(-.72, 0, 0)))
# bench under the roof, a table, a lamp post and a life ring on the rail
p += [box((1.8, .5, .08), (gx, gy + 1.2, .5), 'M_Wood', .02), box((1.8, .08, .5), (gx, gy + 1.45, .85), 'M_Wood', .02)]
for sx in (-.75, .75): p.append(box((.1, .5, .5), (gx + sx, gy + 1.25, .25), 'M_WoodDark', .02))
for lx, ly in ((12.5, W / 2), (27.5, -W / 2), (L + .3, 3.4)):
    p += [cyl(.07, 3.0, (lx, ly, 0), 'M_Navy', 10), lathe([(.1, 0), (.16, .08), (.1, .16)], 'M_Navy', 10, loc=(lx, ly, 2.95)), sphere(.24, (lx, ly, 3.3), 'M_Lamp', segs=14, rings=10)]
ring = lathe([(.3, -.07), (.37, -.1), (.46, -.07), (.48, 0), (.46, .07), (.37, .1), (.3, .07), (.28, 0), (.3, -.07)], 'M_FabricOrange', 20); ring.rotation_euler = (pi / 2, 0, 0); ring.location = (L + 2.2, EW / 2 - .16, .62); p.append(ring)
for a in range(4):
    b = lathe([(.29, -.075), (.38, -.11), (.47, -.075), (.49, 0), (.47, .075), (.38, .11), (.29, .075), (.27, 0), (.29, -.075)], 'M_White', 4, arc=.5); b.rotation_euler = (pi / 2, a * pi / 2 + .5, 0); b.location = (L + 2.2, EW / 2 - .16, .62); p.append(b)
finish('pier', p, os.path.join(OUT, 'structures'))
