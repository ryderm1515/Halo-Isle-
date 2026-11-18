"""Halo Isle v1.1 sports kit and a new jet ski. Run: python make_v11.py <public/assets dir>
Blender -Y = three.js +Z (the front). Every asset's origin is where the game places it."""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from kit import *
OUT = sys.argv[-1]; pi = math.pi; PROPS = os.path.join(OUT, 'props'); VEH = os.path.join(OUT, 'vehicles')

def bowling_pin():
    reset(); prof = [(0, 0), (.055, 0), (.085, .02), (.104, .1), (.106, .16), (.095, .25), (.068, .34), (.047, .4), (.044, .44), (.052, .5), (.062, .55), (.058, .6), (.04, .63), (0, .64)]
    p = [lathe(prof, 'M_White', 28)]
    for z0, z1 in ((.405, .425), (.44, .46)):   # two red neck stripes, a hair proud of the surface
        p.append(lathe([(.0475 + (z0 - .405) * -.1, z0), (.0478, z1)], 'M_Red', 28))
    return finish('bowling_pin', p, PROPS)

def bowling_lane():
    """Approach, lane, gutters, pin deck, pit, masking unit and the ball return. Foul line at y=0, head pin at y=+14."""
    reset(); p = []; L = 17.4
    p += [box((2.1, L, .06), (0, L / 2 - .6, .03), 'M_Wood', .004), box((2.1, 2.2, .055), (0, -1.7, .0275), 'M_WoodDark', .004)]
    for e in (-1, 1):
        g = lathe([(.13, 0), (.13, 15.6)], 'M_Grey', 14, arc=pi); g.rotation_euler = (-pi / 2, 0, 0); g.location = (e * 1.18, -.2, .09); p.append(g)   # half-pipe gutters
        p += [box((.12, L + 2.2, .22), (e * 1.38, L / 2 - 1.7, .11), 'M_White', .03), box((.1, 3.2, 1.25), (e * 1.36, 14.9, .62), 'M_NavyBlue', .03)]          # cappings and kickbacks
    p += [box((2.1, .05, .012), (0, 0, .066), 'M_Red', 0)]                                            # foul line
    for i in range(-2, 3):                                                                             # aiming arrows and dots
        a = cyl(.07, .006, (i * .36, 4.4 + abs(i) * .28, .06), 'M_NavyBlue', 3, r2=0); a.rotation_euler = (0, 0, pi); a.scale = (1, 1.9, 1); p.append(a)
        p.append(cyl(.025, .006, (i * .36, 2.0, .06), 'M_NavyBlue', 10))
    p += [box((2.6, 2.2, .07), (0, 15.0, .035), 'M_Black', .01), box((2.6, .6, .5), (0, 16.4, .25), 'M_Black', .02), box((2.9, .12, 1.3), (0, 16.75, .9), 'M_FabricBlue', .03)]   # pin deck, pit, curtain
    p += [box((3.0, .5, .95), (0, 13.6, 2.15), 'M_NavyBlue', .08, segs=3), box((3.1, .56, .08), (0, 13.6, 1.66), 'M_White', .03), box((3.1, .56, .08), (0, 13.6, 2.64), 'M_White', .03)]   # masking unit
    for e in (-1, 1): p.append(box((.14, .5, 2.7), (e * 1.5, 13.6, 1.35), 'M_White', .04))
    # ball return: a rounded hood on a plinth beside the approach
    p += [box((.62, 1.0, .5), (1.95, -1.6, .25), 'M_NavyBlue', .08, segs=3), sphere(.36, (1.95, -1.6, .55), 'M_Glass', (1, 1.3, .7), 20, 12), lathe([(.24, 0), (.26, .03), (.26, .06), (.2, .06)], 'M_Metal', 24, loc=(1.95, -1.6, .5))]
    return finish('bowling_lane', p, PROPS)

def hoop():
    """Pole with a padded base, a curved arm, a glass board with its painted box, and the rim. Net is separate (it swings)."""
    reset(); p = []
    p += [cyl(.28, .1, (0, 1.0, 0), 'M_Grey', 20), cyl(.14, .5, (0, 1.0, .1), 'M_FabricBlue', 18), cyl(.075, 3.55, (0, 1.0, .1), 'M_NavyBlue', 16)]
    p.append(tube([(0, 1.0, 3.55), (0, .95, 3.72), (0, .6, 3.62), (0, .2, 3.45)], .055, 'M_NavyBlue', 10))
    p += [box((1.8, .04, 1.08), (0, .1, 3.45), 'M_Glass', .02), box((1.86, .07, .06), (0, .1, 4.0), 'M_White', .02), box((1.86, .07, .06), (0, .1, 2.9), 'M_White', .02)]
    for e in (-1, 1): p.append(box((.06, .07, 1.16), (e * .93, .1, 3.45), 'M_White', .02))
    for x, z, w, hgt in ((0, 3.53, .6, .04), (0, 3.13, .6, .04), (-.28, 3.33, .04, .44), (.28, 3.33, .04, .44)): p.append(box((w, .05, hgt), (x, .07, z), 'M_Red', .006))
    r = lathe([(.23, -.012), (.245, -.012), (.245, .012), (.23, .012)], 'M_FabricOrange', 32, loc=(0, -.33, 3.05)); p.append(r)
    p += [box((.16, .3, .03), (0, -.07, 3.04), 'M_FabricOrange', .01), box((.2, .05, .16), (0, .07, 3.0), 'M_FabricOrange', .01)]
    return finish('hoop', p, PROPS)

def hoop_net():
    """Twelve cords twisting down to a narrower mouth, with two loops of knots. Origin at the rim's centre."""
    reset(); p = []; N = 12
    for i in range(N):
        for sgn in (1, -1):
            pts = [(math.cos(a) * r, math.sin(a) * r, z) for a, r, z in ((2 * pi * (i + sgn * t * .9) / N, .235 - t * .1, -t * .44) for t in (k / 6 for k in range(7)))]
            p.append(tube(pts, .007, 'M_FabricWhite', 4))
    for z, r in ((-.15, .2), (-.3, .165)): p.append(lathe([(r - .006, z - .006), (r + .006, z - .006), (r + .006, z + .006), (r - .006, z + .006)], 'M_FabricWhite', 24))
    return finish('hoop_net', p, PROPS)

def archery_target():
    """A straw boss bound with rope on a wooden easel. The painted face is laid on by the game. Origin at the boss centre."""
    reset(); p = []
    boss = lathe([(0, -.17), (1.12, -.17), (1.2, -.12), (1.22, 0), (1.2, .12), (1.12, .17), (0, .17)], 'M_Sand', 40); boss.rotation_euler = (pi / 2, 0, 0); p.append(boss)
    for a in (pi / 4, -pi / 4): p.append(tube([(math.cos(a + t) * 1.235, 0, math.sin(a + t) * 1.235) for t in (k * .08 - .24 for k in range(7))], .03, 'M_Rope', 6))
    for e in (-1, 1):
        p.append(tube([(e * .75, -.25, -.65), (e * 1.0, -.55, -1.55)], .05, 'M_WoodDark', 8)); p.append(tube([(e * .75, .25, -.3), (e * .85, .9, -1.55)], .045, 'M_WoodDark', 8))
    p += [box((1.9, .12, .1), (0, -.3, -.75), 'M_Wood', .02), box((2.0, .1, .08), (0, .55, -1.2), 'M_Wood', .02)]
    return finish('archery_target', p, PROPS)

def bow():
    """A recurve bow, grip at the origin, limbs along +Z/-Z, curving back towards +Y (away from the archer)."""
    reset(); p = []
    for s in (1, -1):
        pts = [(0, .02 * t * t * 6 - .1 * math.sin(t * pi) * .5 + (.06 if t > .85 else 0) * (t - .85) * -10, s * (.07 + t * .42)) for t in (k / 10 for k in range(11))]
        p.append(tube(pts, .022, 'M_WoodDark', 8, r_end=.011))
    p += [cyl(.03, .14, (0, 0, -.07), 'M_FabricRed', 12), sphere(.012, (0, .065, .49), 'M_Metal', segs=8, rings=6), sphere(.012, (0, .065, -.49), 'M_Metal', segs=8, rings=6)]
    return finish('bow', p, PROPS)

def arrow():
    reset(); p = [cyl(.009, .76, (0, .36, 0), 'M_Wood', 6, rot=(pi / 2, 0, 0))]
    p.append(cyl(.022, .09, (0, -.4, 0), 'M_Metal', 8, r2=.001, rot=(pi / 2, 0, 0)))
    for k in range(3):
        a = k * 2 * pi / 3; f = plane(.045, .13, (math.cos(a) * .028, .3, math.sin(a) * .028), 'M_FabricRed', rot=(pi / 2, a, 0)); p.append(f)
    p.append(cyl(.012, .03, (0, .4, 0), 'M_Yellow', 8, rot=(pi / 2, 0, 0)))
    return finish('arrow', p, PROPS)

def jetski():
    """A sit-down jet ski: deep-vee hull with sponsons and a rub rail, a swept cowl with storage hatch and screen,
    a stepped saddle, footwells with mats, chrome grab rails and bars, a swim platform, and a two-tone livery."""
    reset(); p = []
    # hull: loft of cross-sections from bow (y=-1.55) to stern (y=1.45); each section is a deep vee widening to a soft deck edge
    secs = [(-1.55, .02, .30, .38), (-1.3, .22, .2, .52), (-1.0, .36, .13, .62), (-.6, .46, .08, .66), (-.1, .5, .06, .66), (.5, .5, .06, .62), (1.05, .48, .07, .58), (1.45, .44, .1, .52)]
    bm = bmesh.new(); rings = []
    for y, hw, keel, top in secs:
        ring = []
        for t in [k / 10 for k in range(11)]:          # starboard half, keel -> deck edge
            a = t * pi / 2; x = hw * math.sin(a) ** .8; z = keel + (top - keel) * (1 - math.cos(a)) ** 1.2 if t < 1 else top
            ring.append((x, y, z))
        ring += [(x * .7, y, top + .05) for x, _, _ in [(hw, 0, 0)]]       # deck crown
        full = ring + [(-x, yy, z) for x, yy, z in reversed(ring)]
        rings.append([bm.verts.new(v) for v in full])
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    hull = obj('Hull', bm, 'M_White'); sub = hull.modifiers.new('s', 'SUBSURF'); sub.levels = 2; apply(hull); p.append(hull)
    # livery: a blue lower hull (a skin just outside the white one, cut off at the chine), a yellow pinstripe along the chine, black rub rails
    low = hull.copy(); low.data = hull.data.copy(); C.collection.objects.link(low); low.data.materials.clear(); low.data.materials.append(M('M_FabricBlue'))
    for v in low.data.vertices: v.co.x *= 1.012; v.co.y *= 1.004; v.co.z = min(v.co.z, .27) - .004
    p.append(low)
    def chine_x(hw, keel, top, z=.275):
        if z <= keel: return None
        q = min(1, ((z - keel) / (top - keel)) ** (1 / 1.2)); a = math.acos(max(-1, 1 - q)); return hw * math.sin(a) ** .8 + .012
    strip = [(chine_x(hw, keel, top), y, .275) for y, hw, keel, top in secs if chine_x(hw, keel, top)]
    for sx in (1, -1): p.append(tube([(sx * x, y, z) for x, y, z in strip], .014, 'M_Yellow', 5))
    # cowl: a swept nose with a storage hatch line, tinted screen and twin headlamps
    p += [sphere(.4, (0, -.82, .56), 'M_FabricBlue', (1.0, 1.75, .5), 24, 12), sphere(.28, (0, -1.08, .5), 'M_White', (1.0, 1.4, .42), 18, 10), box((.42, .3, .02), (0, -.98, .65), 'M_Grey', .01, rot=(-.25, 0, 0))]
    p.append(plane(.5, .28, (0, -.48, .86), 'M_Glass', rot=(-.95, 0, 0)))
    for e in (-1, 1): p.append(sphere(.055, (e * .26, -1.3, .52), 'M_Lamp', (1.0, .5, .7), 10, 6))
    # bars: riser, chrome bar with black grips, mirrors on stalks, a small dash pod
    p += [tube([(0, -.38, .74), (0, -.26, .98)], .045, 'M_Black', 10), tube([(-.38, -.18, 1.03), (-.16, -.28, .99), (.16, -.28, .99), (.38, -.18, 1.03)], .022, 'M_Metal', 8), box((.22, .1, .08), (0, -.36, .92), 'M_Black', .03)]
    for e in (-1, 1): p += [cyl(.032, .14, (e * .38, -.18, 1.03), 'M_Black', 10, rot=(0, pi / 2, 0)), tube([(e * .3, -.5, .78), (e * .44, -.58, .9)], .01, 'M_Black', 5), sphere(.055, (e * .46, -.6, .92), 'M_Metal', (1, .35, .7), 8, 6)]
    # saddle: two steps, piped edges, a grab strap; footwells with grey mats; a chrome rear grab rail
    p += [box((.46, .7, .2), (0, .05, .7), 'M_FabricBlue', .09, segs=4), box((.48, .62, .22), (0, .66, .74), 'M_FabricBlue', .1, segs=4), box((.4, .6, .025), (0, .05, .805), 'M_FabricWhite', .01), box((.5, .05, .05), (0, .38, .83), 'M_Black', .02)]
    for e in (-1, 1): p += [box((.22, 1.25, .03), (e * .42, .4, .48), 'M_Grey', .01), box((.08, 1.3, .14), (e * .58, .4, .53), 'M_White', .04)]
    p.append(tube([(-.26, .95, .82), (-.27, 1.18, .9), (.27, 1.18, .9), (.26, .95, .82)], .018, 'M_Metal', 6))
    # stern: swim platform with a non-slip mat, the jet nozzle and a tow eye
    p += [box((.86, .35, .06), (0, 1.5, .26), 'M_White', .03), box((.74, .26, .015), (0, 1.5, .295), 'M_Grey', .005)]
    nz = lathe([(.1, 0), (.12, .02), (.09, .18), (.07, .18), (.08, .02)], 'M_Metal', 16, loc=(0, 1.5, .18)); nz.rotation_euler = (-pi / 2, 0, 0); p.append(nz)
    p.append(plane(.4, .19, (0, -1.12, .68), 'M_Emblem', rot=(-1.15, 0, 0)))
    return finish('jetski', p, VEH)

import sys as _s
for f in (bowling_pin, bowling_lane, hoop, hoop_net, archery_target, bow, arrow, jetski):
    if len(_s.argv) < 3 or f.__name__ in _s.argv[-2].split(','): f()
