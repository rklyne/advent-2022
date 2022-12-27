import * as R from "ramda";

import { data, testData } from "./input";

type Resource = "ore" | "clay" | "obsidian" | "geode";
type Supplies = Record<Resource, number>;
type Ingredients = [Resource, number][];
type RobotCosts = Record<Resource, Ingredients>;
type Blueprint = RobotCosts;
const resources: Resource[] = ["ore", "clay", "obsidian", "geode"];
type Input = RobotCosts[];
const ORE: Resource = "ore";
const CLAY: Resource = "clay";
const OBSIDIAN: Resource = "obsidian";
const GEODE: Resource = "geode";

const parse = (text: string): Input => {
  // Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const recipiesText = line.split(" Each ").slice(1);
      return Object.fromEntries(
        recipiesText.map((recipe) => {
          // "ore robot costs 4 ore."
          // "obsidian robot costs 3 ore and 14 clay."
          const parts = recipe.replace(".", "").split(" ");
          const ingredients: Ingredients = [
            [parts[4] as Resource, parseInt(parts[3])],
          ];
          if (parts[6]) {
            ingredients.push([parts[7] as Resource, parseInt(parts[6])]);
          }
          return [parts[0], ingredients];
        })
      ) as RobotCosts;
    });
};

const geodesInMinutes = (blueprint: Blueprint, minutes: number): number => {
  type Node = [number, Supplies, Supplies, Resource?]; // minutesLeft, supplies, robots, building
  const initSupplies: Supplies = {
    ore: 0,
    clay: 0,
    obsidian: 0,
    geode: 0,
  };
  const initRobots: Supplies = {
    ...initSupplies,
    ore: 1,
  };
  const maxRequirements: Supplies = { ...initSupplies };
  Object.values(blueprint).forEach((recipe) => {
    recipe.forEach(([resource, amount]) => {
      if (maxRequirements[resource] < amount)
        maxRequirements[resource] = amount;
    });
  });

  const canAfford = (recipe: Ingredients, supplies: Supplies): boolean => {
    if (!recipe) throw new Error("" + recipe);
    if (!supplies) throw new Error("" + supplies);
    return R.all(([item, cost]) => supplies[item] >= cost, recipe);
  };
  const nodes: Node[] = [];
  const roundsUntilAfford = (
    recipe: Ingredients,
    supplies: Supplies,
    robots: Supplies
  ): number => {
    return Math.min(
      100,
      Math.max(
        ...recipe.map(([resource, quantity]) =>
          Math.max(
            0,
            Math.ceil((quantity - supplies[resource]) / robots[resource])
          )
        )
      )
    );
  };
  const counters: Record<number, number> = {}
  R.range(0, 10).forEach(n => counters[n] = 0)
  const addChoices = (minutes, supplies, robots) => {
    // nodes.push([minutes - 1, { ...supplies }, { ...robots }, undefined]);
    resources.forEach((resource) => {
      // skip if we aren't making the stuff to build this robot
      counters[0] += 1
      if (R.any(([item, quantity]) => robots[item] == 0, blueprint[resource])) {
        console.log("no robots to build " + resource + " " + JSON.stringify(blueprint[resource]) + " " + JSON.stringify(robots) )
        return;
      }
      counters[1] += 1
      // skip if we have enough of this robot to build anything per turn
      if (resource != GEODE && maxRequirements[resource] <= robots[resource]) {
        // console.log({maxedRobots: robots, resource})
        return
      }
      counters[2] += 1
      // TODO: IF there isn't a way to to build enough geode to beat `best` then don't search this path
      if (true || canAfford(blueprint[resource], supplies)) {
        // console.log(`queuing up build - ${resource}`)
        const skipRounds = roundsUntilAfford(
          blueprint[resource],
          supplies,
          robots
        );
        const mySupplies = {...supplies}
        if (skipRounds) {
          if (skipRounds > 1000) throw "oops rounds";
          if (skipRounds < 0) throw "oops rounds low";
          // console.log({ skipRounds });
          R.range(0, skipRounds).forEach(() => harvest(mySupplies, robots));
        }
        const timeUntil = minutes - 1 - skipRounds;
        if (timeUntil < 0) return;
        nodes.push([timeUntil, mySupplies, { ...robots }, resource]);
        counters[3] += 1
      }
    });
  };
  const harvest = (supplies: Supplies, robots: Supplies) => {
    Object.entries(robots).forEach(([resource, harvest]) => {
      supplies[resource] += harvest;
      // console.log(`harvest ${harvest} ${resource}`)
    });
  };
  addChoices(minutes, initSupplies, initRobots);
  let limit = 1_000_000;
  const seen = new Set<string>();
  let best = 0;
  let steps = 0;
  let seenSkip = 0;
  while (nodes.length > 0) {
    limit--;
    steps++;
    if (limit <= 0) {
      console.log({ best, steps, seenSkip, counters });
      throw "oops limit";
    }
    const node = nodes.pop();
    const [minutes, supplies, robots, toBuy] = node;
    // if (robots.obsidian > 0)
      // throw "oops obsidian " + minutes + JSON.stringify({ supplies, robots });
    if (minutes <= 0) {
      if (supplies.geode > best) {
        best = supplies.geode;
        console.log({ best });
      }
      continue;
    }
    // const nodeId = [
    //   minutes,
    //   "|",
    //   ...Object.entries(supplies),
    //   "|",
    //   ...Object.entries(robots),
    //   toBuy,
    // ].join();
    // if (seen.has(nodeId)) {
    //   seenSkip += 1;
    //   continue;
    // }
    // seen.add(nodeId);
    // spend
    const buying = toBuy && canAfford(blueprint[toBuy], supplies);
    if (buying) {
      blueprint[toBuy].forEach(([name, cost]) => {
        supplies[name] -= cost;
      });
    }
    // harvest
    harvest(supplies, robots);
    if (buying) {
      // console.log({ buying, toBuy });
      robots[toBuy] += 1;
    }
    addChoices(minutes, supplies, robots);
  }
  console.log({ best, steps, seenSkip, counters });
  return best;
};

const part1 = (input: Input) => {
  const MINUTES = 24;
  let total = 0;
  input.forEach((blueprint, idx) => {
    total += (idx + 1) * geodesInMinutes(blueprint, MINUTES);
  });
  return total;
};

const part2 = (input: Input) => {
  return 0;
};

describe("day X", () => {
  it("parses", () => {
    const bp1 = parse(testData)[0];
    expect(bp1).toStrictEqual(expect.objectContaining({ clay: [["ore", 2]] }));
    expect(bp1).toStrictEqual(
      expect.objectContaining({
        obsidian: [
          ["ore", 3],
          ["clay", 14],
        ],
      })
    );
  });

  it("can simulate geode harvest", () => {
    const geodes = geodesInMinutes(
      {
        ore: [[ORE, 4]],
        clay: [[ORE, 2]],
        obsidian: [
          [ORE, 3],
          [CLAY, 14],
        ],
        geode: [
          [ORE, 2],
          [OBSIDIAN, 7],
        ],
      },
      24
    );
    expect(geodes).toBe(9);
  });

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(33);
    });

    it.skip("answer", () => {
      expect(part1(parse(data))).toBe(-1);
    });
  });

  describe.skip("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(-1);
    });

    it.skip("answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
