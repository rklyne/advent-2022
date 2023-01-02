import * as R from "ramda";
import Heap from "heap";

import { data, testData } from "./input";

type Junction = { name: string; moves: string[]; flowRate: number };
type PipeMap = Junction[];

class State {
  open: string[];
  label: string;

  constructor(
    private junctions: PipeMap,
    public position: string = "AA",
    public score: number = 0,
    public time: number = 1,
    open: string[] = [],
    protected pathSinceOpening: Set<string> = new Set(),
    public log: string[] = []
  ) {
    this.open = open;
    this.updateLabel();
  }

  get id() {
    return this.label + "@" + this.time;
  }

  copy(): State {
    return new State(
      this.junctions,
      this.position,
      this.score,
      this.time,
      [...this.open],
      new Set(this.pathSinceOpening),
      [...this.log]
    );
  }

  doToggle(name: string): State {
    if (this.open.includes(name)) throw "oops already open " + name;
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${this.time} open ${name}`
    );
    next.addTime(1);
    next.open.push(name);
    next.pathSinceOpening.clear();
    return next;
  }

  seen(nextPlace: string): boolean {
    if (this.pathSinceOpening.has(nextPlace)) return true;
    return false;
  }

  doMove(nextPlace: string, cost: number): State {
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${
        this.time
      } move ${nextPlace} /${cost}`
    );
    next.position = nextPlace;
    next.pathSinceOpening.add(nextPlace);
    next.addTime(cost);
    return next;
  }

  wait(time: number): State {
    const next = this.copy();
    next.log.push(
      `(${this.scoreIncrement()}) minute ${this.time} wait ${time}`
    );
    next.addTime(time);
    return next;
  }

  addTime(n: number = 1) {
    this.time += n;
    R.range(0, n).forEach(() => {
      this.addScore();
    });
    this.updateLabel();
  }

  updateLabel() {
    this.label = this.open.sort().join(",");
  }

  addScore(): void {
    this.score += this.scoreIncrement();
  }

  scoreIncrement(): number {
    return R.sum(
      this.junctions
        .filter((j) => this.open.includes(j.name))
        .map((j) => j.flowRate)
    );
  }
}

type DistMap = Record<string, number>;
type Graph = Record<string, DistMap>;
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
const findShortestPaths = (
  graph: Graph,
  startNode: string,
  endNodes: string[]
) => {
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
  const endNodeData = R.sortBy(
    R.prop("distance"),
    endNodes
      .filter((n) => distances[n])
      .map((n) => ({ distance: distances[n], n }))
  );
  const endNode = R.head(endNodeData).n;
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
    distances,
  };

  return results;
};
// returns {fromNode: {toNode: cost}}
const buildShortestPathMatrix = (
  map: PipeMap
): Record<string, Record<string, number>> => {
  const toNodes = map
    .filter((j) => j.flowRate != 0)
    .map((junction) => junction.name);
  const fromNodes = ["AA", ...toNodes];
  const result = {};
  const graph = Object.fromEntries(
    map.map((junction) => [
      junction.name,
      Object.fromEntries(junction.moves.map((n) => [n, 1])),
    ])
  );

  for (const fromNode of fromNodes) {
    const paths = findShortestPaths(graph, fromNode, toNodes);
    result[fromNode] = {};
    for (const toNode of toNodes) {
      if (fromNode != toNode)
        result[fromNode][toNode] = paths.distances[toNode];
    }
  }
  return result;
};

type BasicState = {
  id: string;
  score: number;
};

const part1Search = (map: PipeMap, steps = 30) => {
  const initialState = new State(map);
  const counters: Record<string, number> = {};
  const count = (n: string) => {
    if (!(n in counters)) {
      counters[n] = 0;
    }
    counters[n] += 1;
  };
  const searcher = () => {
    const scoreWhenOpen: Record<string, number> = {};
    const scoreWhenAt: Record<string, number> = {};
    const junctions: Record<string, Junction> = Object.fromEntries(
      map.map((junction) => [junction.name, junction])
    );
    const paths: Record<string, [string, number, Junction][]> = {};
    /*
      Object.fromEntries(
        map.map((junction) => [
          junction.name,
          junction.moves.map((name) => [name, 1, junctions[name]]),
        ])
      );
      */

    const shortestPaths = buildShortestPathMatrix(map);
    for (const fromNode of Object.keys(shortestPaths)) {
      const junction = junctions[fromNode];
      paths[junction.name] = Object.entries(shortestPaths[junction.name]).map(
        ([toNode, cost]) => [toNode, cost, junctions[toNode]]
      );
    }

    return (state: State) => {
      /**
       * algorithm
       * - search at AA
       * to search:
       * - options = moves + switch (if flowRate != 0)
       * - for each option, from the most time remaining
       *   - if time is at the limit then check if it's the best solution. if yes, keep it.
       *   - if this new option is the best way to reach that place + value setup then search
       * -
       */
      const node = junctions[state.position];
      const choices: State[] = [];
      let acted = false;
      if (false && node.flowRate != 0 && !state.open.includes(node.name)) {
        const newOpen = state.doToggle(node.name);
        const scoreWhenOpenLabel = newOpen.label;
        if (
          scoreWhenOpenLabel in scoreWhenOpen &&
          scoreWhenOpen[scoreWhenOpenLabel] > newOpen.score
        ) {
          // loop protection
          count("non_optimal_open");
          return [];
        } else {
          count("open");
          scoreWhenOpen[scoreWhenOpenLabel] = newOpen.score;
          choices.push(newOpen);
          acted = true;
        }
      }

      for (const [nextPlace, cost, junction] of paths[node.name]) {
        if (state.open.includes(nextPlace)) {
          count("already_open");
          continue;
        }
        if (state.seen(nextPlace)) {
          count("no_backtrack");
          continue;
        }
        const newPosition = state.doMove(nextPlace, cost).doToggle(nextPlace);
        if (cost > steps - state.time) {
          count("time_exceeded");
          continue;
        }
        const posLabel =
          nextPlace + "+" + newPosition.label + "@" + newPosition.time;
        if (
          posLabel in scoreWhenAt &&
          scoreWhenAt[posLabel] >= newPosition.score
        ) {
          // loop protection
          count("non_optimal");
          continue;
        } else {
          scoreWhenAt[posLabel] = newPosition.score;
          count("move");
          choices.push(newPosition);
          acted = true;
        }
      }
      if (!acted) {
        count("wait");
        choices.push(state.wait(1));
      }
      return choices;
    };
  };
  const result = runSearch(
    [initialState],
    searcher(),
    (state) => state.time > steps,
    {
      priority: (a, b) => a.time - b.time,
    }
  );
  // console.log({ counters });
  return result;
};

class State2 {
  label: string;

  constructor(
    private junctions: PipeMap,
    public elfPaths: Record<string, [string, number, Junction][]>,
    public elephantPaths: Record<string, [string, number, Junction][]>,
    public elfPosition: string = "AA",
    public elephantPosition: string = "AA",
    public score: number = 0,
    public elfTime: number = 1,
    public elephantTime: number = 1,
    public openAt: Record<string, number> = {},
    public log: string[] = []
  ) {
    this.updateLabel();
  }

  get id() {
    return this.label;
  }

  copy(): State2 {
    return new State2(
      this.junctions,
      this.elfPaths,
      this.elephantPaths,
      this.elfPosition,
      this.elephantPosition,
      this.score,
      this.elfTime,
      this.elephantTime,
      { ...this.openAt },
      [...this.log]
    );
  }

  seen(nextPlace: string): boolean {
    return false;
  }

  doMoveElf(nextPlace: string, cost: number): State2 {
    if (nextPlace in this.openAt) throw "oops already open " + nextPlace;
    const next = this.copy();
    next.log.push(
      `minute ${this.elfTime} elf move ${nextPlace} /${cost} + minute ${
        this.elfTime + cost + 1
      }`
    );
    next.elfTime += cost + 1;
    next.elfPosition = nextPlace;
    next.openAt[nextPlace] = next.elfTime;
    return next;
  }

  doMoveElephant(nextPlace: string, cost: number): State2 {
    if (nextPlace in this.openAt) throw "oops already open " + nextPlace;
    const next = this.copy();
    next.log.push(
      `minute ${
        this.elephantTime
      } elephant move ${nextPlace} /${cost} + minute ${
        this.elephantTime + cost + 1
      }`
    );
    next.elephantTime += cost + 1;
    next.elephantPosition = nextPlace;
    next.openAt[nextPlace] = next.elephantTime;
    return next;
  }

  waitElephant(time: number): State2 {
    const next = this.copy();
    next.log.push(`minute ${this.elephantTime} elephant wait ${time}`);
    next.elephantTime += time;
    return next;
  }

  waitElf(time: number): State2 {
    const next = this.copy();
    next.log.push(`minute ${this.elfTime} elf wait ${time}`);
    next.elfTime += time;
    return next;
  }

  updateLabel() {
    const times = "+" + this.elfTime + "+" + this.elephantTime;
    const positions = "+" + this.elfPosition + "+" + this.elephantPosition;
    // this.label =
    //   Object.keys(this.openAt).sort().join(",") +
    //   "@" +
    //   this.elfTime +
    //   "@" +
    //   this.elephantTime
    //   // + positions
    this.label =
      this.elfPaths[this.elfPosition]
        .map((tpl) => tpl[0])
        .filter((n) => !(n in this.openAt))
        .join(",") +
      "|" +
      this.elephantPaths[this.elephantPosition]
        .map((tpl) => tpl[0])
        .filter((n) => !(n in this.openAt))
        .join(",") +
      "|" + positions
      "|" + times;
  }

  updateScore(steps: number): number {
    this.score = R.sum(
      Object.entries(this.openAt).map(
        ([node, time]) =>
          this.junctions.filter((j) => j.name == node)[0].flowRate *
          (steps - time + 1)
      )
    );
    // if (this.score != 0) throw "oops got score" + this.score
    return this.score;
  }
}

const makeCounters = () => {
  const counters: Record<string, number> = {};
  const count = (n: string) => {
    if (!(n in counters)) {
      counters[n] = 0;
    }
    counters[n] += 1;
  };
  return { count, counters };
};

const part2Search = (map: PipeMap, steps = 26) => {
  const { count, counters } = makeCounters();

  const junctions: Record<string, Junction> = Object.fromEntries(
    map.map((junction) => [junction.name, junction])
  );
  const allPaths: Record<string, [string, number, Junction][]> = {};

  const shortestPaths = buildShortestPathMatrix(map);
  for (const fromNode of Object.keys(shortestPaths)) {
    const junction = junctions[fromNode];
    allPaths[junction.name] = Object.entries(shortestPaths[junction.name]).map(
      ([toNode, cost]) => [toNode, cost, junctions[toNode]]
    );
  }

  const filterNodes = (allPaths, nodes) => {
    const result = {};
    for (const key of nodes) {
      result[key] = allPaths[key].filter((path) => nodes.includes(path[0]));
    }
    return result;
  };
  const initialStates: State2[] = [];
  const fromNodes = Object.keys(allPaths);
  for (const n of R.range(0, 2 ** fromNodes.length)) {
    const key = n.toString(2);
    const elfNodes = [
      "AA",
      ...fromNodes.filter((node, idx) => key[idx] == "1"),
    ];
    const elephantNodes = [
      "AA",
      ...fromNodes.filter((node, idx) => key[idx] != "1"),
    ];
    const elfPaths = filterNodes(allPaths, elfNodes);
    const elephantPaths = filterNodes(allPaths, elephantNodes);

    initialStates.push(new State2(map, elfPaths, elephantPaths));
  }

  const bestPossibleScore = (state: State2): number => {
    const elfScore = R.sum(
      state.elfPaths[state.elfPosition].map(([name, cost, junction]) => {
        if (name in state.openAt) return 0;
        return junction.flowRate * (steps - state.elfTime - cost + 2);
      })
    );
    const elephantScore = R.sum(
      state.elephantPaths[state.elephantPosition].map(
        ([name, cost, junction]) => {
          if (name in state.openAt) return 0;
          return junction.flowRate * (steps - state.elephantTime - cost + 2);
        }
      )
    );
    return elfScore + elephantScore + state.score;
  };

  const searcher = () => {
    const scoreWhenOpen: Record<string, number> = {};
    const scoreWhenAt: Record<string, number> = {};

    return (state: State2) => {
      /**
       * algorithm
       * - search at AA
       * to search:
       * - options = moves + switch (if flowRate != 0)
       * - for each option, from the most time remaining
       *   - if time is at the limit then check if it's the best solution. if yes, keep it.
       *   - if this new option is the best way to reach that place + value setup then search
       * -
       */
      const elfNode = junctions[state.elfPosition];
      const elephantNode = junctions[state.elephantPosition];
      if (state.elfTime > 50) throw "oops elf time " + JSON.stringify(state);
      if (state.elephantTime > 50)
        throw "oops elephant time " + JSON.stringify(state);
      const choices: State2[] = [];
      let acted = false;
      if (state.elephantTime < state.elfTime) {
        for (const [nextPlace, cost, junction] of state.elephantPaths[
          elephantNode.name
        ]) {
          if (nextPlace in state.openAt) {
            count("elephant_already_open");
            continue;
          }
          const newPosition = state.doMoveElephant(nextPlace, cost);
          if (cost > steps - state.elephantTime) {
            count("elephant_time_exceeded");
            continue;
          }
          newPosition.updateScore(steps);
          count("elephant_move");
          choices.push(newPosition);
          acted = true;
        }
        if (!acted) {
          count("elephant_wait");
          choices.push(state.waitElephant(steps - state.elephantTime + 3));
        }
      } else {
        for (const [nextPlace, cost, junction] of state.elfPaths[
          elfNode.name
        ]) {
          if (nextPlace in state.openAt) {
            count("elf_already_open");
            continue;
          }
          if (state.seen(nextPlace)) {
            count("elf_no_backtrack");
            continue;
          }
          const newPosition = state.doMoveElf(nextPlace, cost);
          if (cost > steps - state.elfTime) {
            count("elf_time_exceeded");
            continue;
          }
          newPosition.updateScore(steps);
          count("elf_move");
          choices.push(newPosition);
          acted = true;
        }
        if (!acted) {
          count("elf_wait");
          choices.push(state.waitElf(steps - state.elfTime + 3));
        }
      }
      for (const c of choices) {
        c.updateScore(steps);
      }
      return choices;
    };
  };
  const result = runSearch(
    initialStates,
    searcher(),
    (state) => Math.min(state.elfTime, state.elephantTime) > steps,
    {
      // work on highest first, to maximise score based pruning
      priority: (b, a) =>
        a.score - b.score,
        // a.elfTime + a.elephantTime - (b.elfTime + b.elephantTime),
      bestPossibleScore,
      maxSteps: 2_000_000,
    }
  );
  return result;
};

const runSearch = <State extends BasicState>(
  initialStates: State[],
  choices: (state: State) => State[],
  isComplete: (state: State) => boolean,
  {
    priority,
    bestPossibleScore,
    maxSteps,
  }: {
    priority?: (me: State, other: State) => number;
    bestPossibleScore?: (s: State) => number;
    maxSteps?: number;
  } = {}
): State => {
  const { count, counters } = makeCounters();
  const stateHeap = new Heap<State>(priority);
  for (const initialState of initialStates) stateHeap.push(initialState);

  let best: State = initialStates[0];

  let limit = maxSteps ?? 5_000;
  let stepCount = 0;
  const visited: Record<string, number> = {};

  while (stateHeap.size()) {
    const state = stateHeap.pop();
    limit--;
    stepCount++;
    if (isComplete(state)) {
      count("complete");
      if (state.score > best.score) {
        best = state;
        count("new_best");
        console.log({ msg: "found new best score", score: state.score });
      }
      continue;
    }
    if (bestPossibleScore && bestPossibleScore(state) <= best.score) {
      // throw "oops couldn't beat best"
      count("cannot_beat_best");
      continue;
    }
    for (const choice of choices(state)) {
      if (choice.id) {
        if (choice.id in visited && visited[choice.id] > choice.score) {
          count("visited");
          continue;
        }
        visited[choice.id] = choice.score;
      }
      stateHeap.push(choice);
    }
    if (limit == 0) {
      console.log({ best, state, len: stateHeap.size() });
      console.log("LIMIT BREAK");
      throw "limit break";
    }
  }
  console.log({ stepCount, counters });
  return best;
};

const parse = (text: string): PipeMap => {
  //Valve CC has flow rate=2; tunnels lead to valves DD, BB
  //
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const bits = line.trim().split(/[ =;]/g);
      return {
        moves: line
          .split("valve")[1]
          .slice(1)
          .trim()
          .split(",")
          .map((s) => s.trim()),
        flowRate: parseInt(bits[5]),
        name: bits[1],
      };
    });
};

const part1 = (map: PipeMap) => {
  const result = part1Search(map);
  // console.log({ msg: "part 1 done", result });
  return result.score;
};

const part2 = (map: PipeMap) => {
  const result = part2Search(map);
  // console.log({ msg: "part 2 done", result });
  return result.score;
};

describe("day 16", () => {
  it("parses", () => {
    expect(parse(testData)[0]).toStrictEqual({
      moves: ["DD", "II", "BB"],
      name: "AA",
      flowRate: 0,
    });
  });

  describe.skip("test cases from reddit", () => {
    describe("can solve a line", () => {
      const inData = `
      Valve LA has flow rate=22; tunnels lead to valves KA, MA
      Valve MA has flow rate=24; tunnels lead to valves LA, NA
      Valve NA has flow rate=26; tunnels lead to valves MA, OA
      Valve OA has flow rate=28; tunnels lead to valves NA, PA
      Valve PA has flow rate=30; tunnels lead to valves OA
      Valve AA has flow rate=0; tunnels lead to valves BA
      Valve BA has flow rate=2; tunnels lead to valves AA, CA
      Valve CA has flow rate=4; tunnels lead to valves BA, DA
      Valve DA has flow rate=6; tunnels lead to valves CA, EA
      Valve EA has flow rate=8; tunnels lead to valves DA, FA
      Valve FA has flow rate=10; tunnels lead to valves EA, GA
      Valve GA has flow rate=12; tunnels lead to valves FA, HA
      Valve HA has flow rate=14; tunnels lead to valves GA, IA
      Valve IA has flow rate=16; tunnels lead to valves HA, JA
      Valve JA has flow rate=18; tunnels lead to valves IA, KA
      Valve KA has flow rate=20; tunnels lead to valves JA, LA
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(2640);
      });
    });

    describe("line, quadratic rates", () => {
      const inData = `
      Valve AA has flow rate=0; tunnels lead to valves BA
      Valve BA has flow rate=1; tunnels lead to valves AA, CA
      Valve CA has flow rate=4; tunnels lead to valves BA, DA
      Valve DA has flow rate=9; tunnels lead to valves CA, EA
      Valve EA has flow rate=16; tunnels lead to valves DA, FA
      Valve FA has flow rate=25; tunnels lead to valves EA, GA
      Valve GA has flow rate=36; tunnels lead to valves FA, HA
      Valve HA has flow rate=49; tunnels lead to valves GA, IA
      Valve IA has flow rate=64; tunnels lead to valves HA, JA
      Valve JA has flow rate=81; tunnels lead to valves IA, KA
      Valve KA has flow rate=100; tunnels lead to valves JA, LA
      Valve LA has flow rate=121; tunnels lead to valves KA, MA
      Valve MA has flow rate=144; tunnels lead to valves LA, NA
      Valve NA has flow rate=169; tunnels lead to valves MA, OA
      Valve OA has flow rate=196; tunnels lead to valves NA, PA
      Valve PA has flow rate=225; tunnels lead to valves OA
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(13468);
      });
    });

    describe("circle", () => {
      const inData = `
      Valve BA has flow rate=2; tunnels lead to valves AA, CA
      Valve CA has flow rate=10; tunnels lead to valves BA, DA
      Valve DA has flow rate=2; tunnels lead to valves CA, EA
      Valve EA has flow rate=10; tunnels lead to valves DA, FA
      Valve FA has flow rate=2; tunnels lead to valves EA, GA
      Valve GA has flow rate=10; tunnels lead to valves FA, HA
      Valve HA has flow rate=2; tunnels lead to valves GA, IA
      Valve IA has flow rate=10; tunnels lead to valves HA, JA
      Valve JA has flow rate=2; tunnels lead to valves IA, KA
      Valve KA has flow rate=10; tunnels lead to valves JA, LA
      Valve LA has flow rate=2; tunnels lead to valves KA, MA
      Valve MA has flow rate=10; tunnels lead to valves LA, NA
      Valve NA has flow rate=2; tunnels lead to valves MA, OA
      Valve OA has flow rate=10; tunnels lead to valves NA, PA
      Valve PA has flow rate=2; tunnels lead to valves OA, AA
      Valve AA has flow rate=0; tunnels lead to valves BA, PA
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(1288);
      });
    });

    describe("clusters", () => {
      const inData = `
      Valve AK has flow rate=100; tunnels lead to valves AJ, AW, AX, AY, AZ
      Valve AW has flow rate=10; tunnels lead to valves AK
      Valve AX has flow rate=10; tunnels lead to valves AK
      Valve AY has flow rate=10; tunnels lead to valves AK
      Valve AZ has flow rate=10; tunnels lead to valves AK
      Valve BB has flow rate=0; tunnels lead to valves AA, BC
      Valve BC has flow rate=0; tunnels lead to valves BB, BD
      Valve BD has flow rate=0; tunnels lead to valves BC, BE
      Valve BE has flow rate=0; tunnels lead to valves BD, BF
      Valve BF has flow rate=0; tunnels lead to valves BE, BG
      Valve BG has flow rate=0; tunnels lead to valves BF, BH
      Valve BH has flow rate=0; tunnels lead to valves BG, BI
      Valve BI has flow rate=0; tunnels lead to valves BH, BJ
      Valve BJ has flow rate=0; tunnels lead to valves BI, BK
      Valve BK has flow rate=100; tunnels lead to valves BJ, BW, BX, BY, BZ
      Valve BW has flow rate=10; tunnels lead to valves BK
      Valve BX has flow rate=10; tunnels lead to valves BK
      Valve BY has flow rate=10; tunnels lead to valves BK
      Valve BZ has flow rate=10; tunnels lead to valves BK
      Valve CB has flow rate=0; tunnels lead to valves AA, CC
      Valve CC has flow rate=0; tunnels lead to valves CB, CD
      Valve CD has flow rate=0; tunnels lead to valves CC, CE
      Valve CE has flow rate=0; tunnels lead to valves CD, CF
      Valve CF has flow rate=0; tunnels lead to valves CE, CG
      Valve CG has flow rate=0; tunnels lead to valves CF, CH
      Valve CH has flow rate=0; tunnels lead to valves CG, CI
      Valve CI has flow rate=0; tunnels lead to valves CH, CJ
      Valve CJ has flow rate=0; tunnels lead to valves CI, CK
      Valve CK has flow rate=100; tunnels lead to valves CJ, CW, CX, CY, CZ
      Valve CW has flow rate=10; tunnels lead to valves CK
      Valve CX has flow rate=10; tunnels lead to valves CK
      Valve CY has flow rate=10; tunnels lead to valves CK
      Valve CZ has flow rate=10; tunnels lead to valves CK
      Valve AA has flow rate=0; tunnels lead to valves AB, BB, CB
      Valve AB has flow rate=0; tunnels lead to valves AA, AC
      Valve AC has flow rate=0; tunnels lead to valves AB, AD
      Valve AD has flow rate=0; tunnels lead to valves AC, AE
      Valve AE has flow rate=0; tunnels lead to valves AD, AF
      Valve AF has flow rate=0; tunnels lead to valves AE, AG
      Valve AG has flow rate=0; tunnels lead to valves AF, AH
      Valve AH has flow rate=0; tunnels lead to valves AG, AI
      Valve AI has flow rate=0; tunnels lead to valves AH, AJ
      Valve AJ has flow rate=0; tunnels lead to valves AI, AK
      `;
      it("part1", () => {
        expect(part1(parse(inData))).toBe(2400);
      });
    });
  });

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(1651);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(1720);
      // 1718 too low
      // 1834 too high
    });
  });

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(1707);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(-1);
      // 2313 too low
    });
  });
});
