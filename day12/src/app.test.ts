import * as R from "ramda";
import { data } from "./input";
import * as Alg from "javascript-algorithms";

// from: https://github.com/noamsauerutley/shortest-path/blob/master/shortestPath.js
const shortestDistanceNode = (
  distances: Record<string, number>,
  visited: Set<string>
) => {
  let shortest = null;

  for (let node in distances) {
    let currentIsShortest =
      shortest === null || distances[node] < distances[shortest];
    if (currentIsShortest && !visited.has(node)) {
      shortest = node;
    }
  }
  return shortest;
};

type Result = {
  distance: number | undefined;
  path: string[];
};
const findShortestPath = (
  graph: Graph,
  startNode: string,
  endNodes: string[]
): Result => {
  // establish object for recording distances from the start node
  let distances: Record<string, number> = {};
  distances = Object.assign(distances, graph[startNode]);

  // track paths
  const parents: Record<string, string> = { endNode: null };
  for (let child in graph[startNode]) {
    parents[child] = startNode;
  }

  // track nodes that have already been visited
  let visited: Set<string> = new Set();

  // find the nearest node
  let node = shortestDistanceNode(distances, visited);

  // for that node
  while (node) {
    // move the node to the visited set
    visited.add(node);
    // find its distance from the start node & its child nodes
    let distance = distances[node];
    let children = graph[node];
    // for each of those child nodes
    for (let child in children) {
      // make sure each child node is not the start node
      if (child === startNode) {
        continue;
      } else {
        // save the distance from the start node to the child node
        let newdistance = distance + children[child];
        // if there's no recorded distance from the start node to the child node in the distances object
        // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
        // save the distance to the object
        // record the path
        if (!distances[child] || distances[child] > newdistance) {
          distances[child] = newdistance;
          parents[child] = node;
        }
      }
    }
    // move to the nearest neighbor node
    node = shortestDistanceNode(distances, visited);
  }

  // using the stored paths from start node to end node
  // record the shortest path
  const endNode = R.head(
    R.sortBy(
      R.prop("distance"),
      endNodes.map((n) => ({ distance: distances[n], n }))
    )
  ).n;
  let shortestPath = [endNode];
  let parent = parents[endNode];
  while (parent) {
    shortestPath.push(parent);
    parent = parents[parent];
  }
  shortestPath.reverse();

  // return the shortest path from start node to end node & its distance
  let results = {
    distance: distances[endNode],
    path: shortestPath,
  };

  return results;
};

type DistMap = Record<string, number>;
type Graph = Record<string, DistMap>;

const A = "a".charCodeAt(0);
const elevation = (chr: string): number => {
  if (chr == "S") return 0;
  if (chr == "E") return 27;
  return chr.charCodeAt(0) - A + 1;
};

type ParseResult = {
  graph: Graph;
  reverseGraph: Graph;
  nodeIds: Record<string, string[]>;
};
const parse = (text: string): ParseResult => {
  const graph: Graph = {};
  const reverseGraph: Graph = {};
  const lines = text.split("\n");
  const nodeIds = {};
  const canMakeMove = (chrFrom: string, chrTo: string): boolean => {
    if (!chrFrom || !chrTo) return false;
    return elevation(chrTo) - elevation(chrFrom) <= 1;
  };
  const cellId = ([i, j]: [number, number]): string => {
    if (lines[i][j] == "S") return "S";
    if (lines[i][j] == "E") return "E";
    return `${i},${j}`;
  };

  const addNode = (graph: Graph, frm: string, to: string) => {
    if (!graph[frm]) {
      graph[frm] = {};
    }
    graph[frm][to] = 1;
  };
  for (const i of R.range(0, lines.length)) {
    for (const j of R.range(0, lines[i].length)) {
      const m = {};
      const c = lines[i][j];
      if (!nodeIds[c]) {
        nodeIds[c] = [];
      }
      const f = cellId([i, j]);
      nodeIds[c].push(cellId([i, j]));
      const adjCells: [number, number][] = [
        [i, j + 1],
        [i, j - 1],
        [i + 1, j],
        [i - 1, j],
      ];
      for (const adjacent of adjCells) {
        if (canMakeMove(c, lines[adjacent[0]]?.[adjacent[1]])) {
          const t = cellId(adjacent);
          addNode(graph, f, t);
          addNode(reverseGraph, t, f);
        }
      }
    }
  }
  return {
    graph,
    reverseGraph,
    nodeIds,
  };
};

const part1 = (g: Graph): number => {
  return findShortestPath(g, "S", ["E"]).distance;
};

const part2 = (parseResult: ParseResult): number => {
  return findShortestPath(parseResult.reverseGraph, "E", parseResult.nodeIds["a"])
    .distance;
};

describe("", () => {
  it("elevations", () => {
    expect(elevation("S")).toBe(0);
    expect(elevation("a")).toBe(1);
    expect(elevation("z")).toBe(26);
    expect(elevation("E")).toBe(27);
  });
  it("can shortest path", () => {
    expect(
      findShortestPath({ c: { e: 1 }, e: { g: 1 } }, "c", ["g"]).distance
    ).toBe(2);
  });

  const testData = `Sabqponm
    abcryxxl
    accszExk
    acctuvwj
    abdefghi`.replace(/ /g, "");

  describe("part1", () => {
    it("can do the sample", () => {
      expect(part1(parse(testData).graph)).toBe(31);
    });
    it("can do my sample", () => {
      expect(part1(parse("SabcdefghijklmnopqrstuvwxyzE").graph)).toBe(27);
      expect(
        part1(
          parse(`
        Sabcdefghijklmnopqrstuvwxyz
        Ezzzzzzzzzzzzyxyzzzzzzzzzzz
        `).graph
        )
      ).toBe(51);
    });
    it("has the answer", () => {
      expect(part1(parse(data).graph)).toBe(408);
    });
  });

  describe("part2", () => {
    it("can do the sample", () => {
      expect(part2(parse(testData))).toBe(29);
    });
    it("has the answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
