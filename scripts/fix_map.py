#!/usr/bin/env python3
import re
from lxml import etree

MAX_DIST = 1
NEIGHBOURHOOD = 15


def parse_path(path):
    return re.findall(r' ?(M|C|\d+ \d+|z) ?', path)


def fix_paths(paths):
    new_paths = []
    points = {}
    index = {}
    for i, (element, path) in enumerate(paths):
        new_path = []
        for word in path:
            if " " not in word:
                new_path.append(word)
                continue
            x, y = [int(v) for v in word.split(' ')]
            pid = len(points)
            points[pid] = (x, y, i)
            ix = x // 20
            iy = y // 20
            index[ix, iy] = index.get((ix, iy), []) + [pid]
            new_path.append(pid)

        new_paths.append((element, new_path))

    original_points = dict(points)
    todo = set(range(len(points)))
    #todo = set(range(1000))
    while todo:
        print("\r{:.2%}%".format(1 - len(todo) / len(original_points)), end="")
        pid = todo.pop()
        closest = None
        closest_dist = None
        x, y, path_id = points[pid]
        for runs in range(10):
            neighbourhood = set()
            ix = x // 20
            iy = y // 20
            for i in (-1, 0, 1):
                for j in (-1, 0, 1):
                    if (ix + i, iy + j) not in index:
                        continue

                    for other in index[ix + i, iy + j]:
                        ox, oy, other_path_id = points[other]
                        if other_path_id == path_id:
                            continue

                        dist = ((x - ox) ** 2 + (y - oy) ** 2) ** 0.5
                        if closest is None or dist < closest_dist:
                            closest = other
                            closest_dist = dist

                        if dist <= NEIGHBOURHOOD:
                            neighbourhood.add((ox, oy))

            #print("closest:", closest_dist)
            if not closest_dist or closest_dist > NEIGHBOURHOOD:
                continue

            ox, oy, other_path_id = original_points[closest]
            ox = 0
            oy = 0
            for nx, ny in neighbourhood:
                ox += nx
                oy += ny

            ox /= len(neighbourhood)
            oy /= len(neighbourhood)
            dx = ox - x
            dy = oy - y
            dist = (dx ** 2 + dy ** 2) ** 0.5
            if dist <= MAX_DIST:
                continue

            move = (dist - MAX_DIST) / 2
            move = dist * 0.1
            x += dx * move / dist
            y += dy * move / dist

        points[pid] = (x, y, path_id)

    for i in range(len(new_paths)):
        (element, path) = new_paths[i]
        new_path = []
        for word in path:
            if isinstance(word, int):
                new_path.append("{} {}".format(*points[word][:2]))
            else:
                new_path.append(word)

        new_paths[i] = (element, new_path)

    return new_paths

root = etree.parse(open("map.svg"))
paths = []
path_elements = root.findall("//svg:g[@id='MapLayer']/svg:path",
                             namespaces={"svg": "http://www.w3.org/2000/svg"})
for element in path_elements:
    path = (element, parse_path(element.get("d")))
    paths.append(path)

paths = fix_paths(paths)

for element, path in paths:
    #print(' '.join(path))
    element.set("d", ' '.join(path))

open("map.new.svg", "wb").write(etree.tostring(root, pretty_print=True))
