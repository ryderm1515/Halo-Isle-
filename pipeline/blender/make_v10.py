"""Halo Isle v1.0 vehicles: a properly shaped golf cart (cowl, fenders, two-tone body, canopy on curved posts, bench seat,
dash, lights, bumpers, bag well) and a sleek jet ski (pointed hull with chine and stripe, cowl, screen, bars, saddle, nozzle).
Run: python make_v10.py <public/assets dir>.  Front faces -Y in Blender (= +Z in three.js). Seats stay where the game expects them."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from kit import *
from make_v9 import fuse
OUT = sys.argv[-1]; pi = math.pi; V = os.path.join(OUT, 'vehicles')

def wheel(x, y, r=.25, w=.2):
    s = 1 if x > 0 else -1
    t = lathe([(r * .6, -w / 2), (r * .9, -w / 2), (r, -w * .32), (r, w * .32), (r * .9, w / 2), (r * .6, w / 2)], 'M_Tyre', 22); t.rotation_euler = (0, pi / 2, 0); t.location = (x, y, r)
    h = lathe([(0, w * .46), (r * .2, w * .5), (r * .3, w * .36), (r * .56, w * .42), (r * .62, w * .3), (r * .62, -w * .4), (0, -w * .4)], 'M_Metal', 18); h.rotation_euler = (0, s * pi / 2, 0); h.location = (x, y, r)
    nuts = [sphere(.018, (x + s * w * .44, y + math.cos(a) * r * .34, r + math.sin(a) * r * .34), 'M_Grey', segs=6, rings=4) for a in [k * 2 * pi / 5 for k in range(5)]]
    return [t, h] + nuts

def golf_cart():
    reset()
    # lower tub + nose cowl + rear deck, fused into one moulded shell
    body = fuse([box((1.26, 2.36, .26), (0, 0, .47), 'M_White', .1, segs=4),
                 box((1.2, .74, .34), (0, -.9, .66), 'M_White', .16, segs=5), sphere(.34, (0, -1.12, .62), 'M_White', (1.7, .8, .62), 20, 12),
                 box((1.26, .9, .3), (0, .8, .62), 'M_White', .1, segs=4)] +
                [sphere(.37, (sx * .56, sy, .33), 'M_White', (.5, 1.0, .82), 16, 10) for sx in (-1, 1) for sy in (-.86, .84)], 'M_White', .018, 6, 6400)
    p = [body]
    # two-tone: a blue belt line round the tub, dark floor, chrome bumpers with rubber pads
    p += [box((1.3, 2.3, .07), (0, 0, .43), 'M_FabricBlue', .03, segs=3), box((1.02, .56, .014), (0, -.36, .615), 'M_Black', 0),
          box((1.18, .09, .08), (0, -1.36, .34), 'M_Metal', .035, segs=3), box((1.18, .09, .08), (0, 1.3, .34), 'M_Metal', .035, segs=3)]
    for sx in (-.42, .42): p += [box((.16, .05, .1), (sx, -1.4, .34), 'M_Black', .02), box((.16, .05, .1), (sx, 1.34, .34), 'M_Black', .02)]
    # bench: two cushions with piping, a shared backrest on chrome hoops, arm rails
    for sx in (-.32, .32):
        p += [box((.57, .54, .13), (sx, .2, .79), 'M_FabricBlue', .06, segs=4), box((.5, .46, .03), (sx, .2, .865), 'M_FabricWhite', .012), box((.57, .13, .44), (sx, .5, 1.07), 'M_FabricBlue', .06, rot=(-.18, 0, 0), segs=4), box((.5, .03, .34), (sx, .437, 1.08), 'M_FabricWhite', .012, rot=(-.18, 0, 0))]
    p += [box((1.22, .5, .12), (0, .22, .68), 'M_White', .05, segs=3)]
    for sx in (-.64, .64): p.append(tube([(sx, .0, .72), (sx, .02, .96), (sx, .42, .98), (sx, .46, .72)], .022, 'M_Metal', 8))
    # dash with a cubby, steering column and wheel, cup holders
    p += [box((1.16, .2, .2), (0, -.62, .96), 'M_White', .07, segs=3), box((.5, .03, .1), (.24, -.515, .96), 'M_Black', .01), tube([(-.3, -.66, .92), (-.3, -.42, 1.2)], .026, 'M_Grey', 8)]
    sw = lathe([(.15, -.02), (.19, -.02), (.19, .02), (.15, .02)], 'M_Black', 20); sw.rotation_euler = (1.0, 0, 0); sw.location = (-.3, -.4, 1.22); p.append(sw)
    p += [box((.3, .02, .03), (-.3, -.4, 1.22), 'M_Grey', .008, rot=(1.0, 0, 0)), box((.03, .02, .3), (-.3, -.4, 1.22), 'M_Grey', .008, rot=(1.0, 0, 0))]
    for sx in (.12, .36): p.append(lathe([(.045, 0), (.05, .06), (.04, .06), (.036, .01)], 'M_Black', 10, loc=(sx, -.62, 1.06)))
    # canopy: a crowned roof with a blue rim on four swept posts
    roof = box((1.5, 2.16, .09), (0, .02, 1.9), 'M_White', .04, segs=3)
    for v in roof.data.vertices: v.co.z += .06 * (1 - (v.co.x / .75) ** 2) * (1 - (v.co.y / 1.08) ** 2)
    p += [roof, box((1.54, 2.2, .04), (0, .02, 1.865), 'M_FabricBlue', .018, segs=2)]
    for sx in (-.64, .64):
        p += [tube([(sx, -.92, .84), (sx, -.98, 1.3), (sx * .98, -.9, 1.84)], .028, 'M_Metal', 8), tube([(sx, .96, .78), (sx, 1.04, 1.3), (sx * .98, .96, 1.84)], .028, 'M_Metal', 8)]
        # lights: chrome-ringed headlamps set in the cowl, amber indicators, red tail lamps
        ring_ = lathe([(.085, 0), (.11, 0), (.11, .03), (.085, .03)], 'M_Metal', 16); ring_.rotation_euler = (pi / 2, 0, 0); ring_.location = (sx * .72, -1.3, .66); p.append(ring_)
        p += [sphere(.085, (sx * .72, -1.3, .66), 'M_Lamp', (1, .45, 1), 14, 8), sphere(.035, (sx * .9, -1.27, .52), 'M_Yellow', (1, .5, 1), 8, 6), box((.16, .04, .07), (sx * .78, 1.275, .64), 'M_Red', .02), sphere(.05, (sx * 1.08, -.62, 1.06), 'M_Metal', (.5, 1, 1.3), 8, 6), tube([(sx * .98, -.62, .98), (sx * 1.08, -.62, 1.04)], .012, 'M_Metal', 5)]
        p += wheel(sx * 1.0, -.86) + wheel(sx * 1.0, .84)
    # windscreen in a slim frame, emblem on the nose, number plate behind
    p += [plane(1.2, .86, (0, -.94, 1.38), 'M_Glass', rot=(-.12, 0, 0)), tube([(-.62, -.89, .96), (-.62, -.99, 1.8)], .014, 'M_Metal', 5), tube([(.62, -.89, .96), (.62, -.99, 1.8)], .014, 'M_Metal', 5), plane(.4, .22, (0, -1.345, .6), 'M_Emblem'), box((.3, .014, .14), (0, 1.285, .5), 'M_FabricWhite', .004)]
    # bag well: two golf bags behind a chrome rail, clubs showing
    p.append(tube([(-.6, 1.2, .78), (-.6, 1.22, 1.16), (.6, 1.22, 1.16), (.6, 1.2, .78)], .02, 'M_Metal', 8))
    for bx, m in ((.3, 'M_FabricBlue'), (-.3, 'M_FabricRed')):
        p += [lathe([(.13, 0), (.155, .04), (.15, .62), (.17, .7), (.15, .72)], m, 14, loc=(bx, .98, .78)), box((.2, .04, .2), (bx, .845, 1.1), 'M_FabricWhite', .02)]
        for k in range(3): p += [cyl(.011, .34, (bx - .06 + k * .06, .96 + (k % 2) * .05, 1.46), 'M_Metal', 5), sphere(.04, (bx - .06 + k * .06, .93 + (k % 2) * .05, 1.82), 'M_Grey', (.7, 1.4, .9), 8, 6)]
    return finish('golf_cart', p, V)

def jetski():
    reset()
    # hull: a long pointed pod with a hard chine, a raised cowl ahead of the bars and a low flat stern deck
    hull = fuse([sphere(.5, (0, -.08, .3), 'M_White', (1.02, 3.05, .58), 32, 18), sphere(.34, (0, -.86, .5), 'M_White', (1.0, 1.7, .7), 22, 12),
                 box((.8, 1.25, .26), (0, .82, .3), 'M_White', .12, segs=4), box((.5, 1.2, .2), (0, .36, .5), 'M_White', .09, segs=4)], 'M_White', .016, 6, 6400)
    for v in hull.data.vertices:
        if v.co.z < .1: v.co.z = .1 - (.1 - v.co.z) * .3                      # flat planing bottom
        if v.co.y < -.9: v.co.x *= 1 - min(1, (-.9 - v.co.y) / .75) * .55     # sharpen the bow
    p = [hull]
    # dark lower hull + a blue stripe along the chine, grey traction mats in the footwells
    p += [box((1.0, 2.5, .05), (0, .14, .2), 'M_NavyBlue', .02, segs=2), box((1.04, 2.2, .03), (0, .2, .29), 'M_FabricBlue', .012, segs=2)]
    for sx in (-.36, .36): p += [box((.2, 1.1, .02), (sx, .5, .44), 'M_Grey', .008), box((.07, 1.5, .09), (sx * 1.42, .3, .25), 'M_Black', .03, segs=3)]
    # saddle: a stepped two-up seat with a grab strap
    p += [box((.42, .62, .18), (0, .12, .66), 'M_FabricBlue', .08, segs=4), box((.44, .6, .2), (0, .7, .7), 'M_FabricBlue', .09, segs=4), box((.36, .5, .03), (0, .12, .755), 'M_FabricWhite', .012), box((.46, .05, .05), (0, .42, .77), 'M_Black', .02), box((.3, .1, .16), (0, 1.02, .66), 'M_Black', .05, segs=3)]
    # cowl, tinted screen, bar riser and grips, mirrors, gauge
    p += [sphere(.3, (0, -.56, .7), 'M_FabricBlue', (1.0, 1.55, .52), 18, 10), plane(.46, .26, (0, -.74, .93), 'M_Glass', rot=(-.75, 0, 0)), tube([(0, -.46, .78), (0, -.38, 1.0)], .04, 'M_Black', 8),
          tube([(-.36, -.3, 1.03), (-.14, -.39, 1.0), (.14, -.39, 1.0), (.36, -.3, 1.03)], .022, 'M_Metal', 8), lathe([(.06, 0), (.07, .02), (.06, .04), (0, .04)], 'M_Black', 12, loc=(0, -.5, .86))]
    for sx in (-.36, .36): p += [cyl(.03, .13, (sx * .92, -.31, 1.03), 'M_Black', 8, rot=(0, pi / 2, .3 * (1 if sx > 0 else -1))), sphere(.055, (sx * .8, -.7, .9), 'M_Metal', (1, .4, .8), 8, 6), sphere(.05, (sx * .42, -1.42, .44), 'M_Lamp', (1, .5, .8), 8, 6)]
    # jet nozzle and a tow eye at the stern, emblem on the nose
    p += [lathe([(.1, 0), (.12, .02), (.09, .2), (.07, .2), (.08, .02)], 'M_Metal', 14, loc=(0, 1.42, .26)), plane(.42, .2, (0, -1.06, .66), 'M_Emblem', rot=(-1.12, 0, 0)), tube([(-.06, 1.42, .44), (0, 1.48, .5), (.06, 1.42, .44)], .012, 'M_Metal', 5)]
    p[-3].rotation_euler = (pi / 2, 0, 0)
    return finish('jetski', p, V)

golf_cart(); jetski()
