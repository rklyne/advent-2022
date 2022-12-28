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
const initSupplies: Supplies = {
  ore: 0,
  clay: 0,
  obsidian: 0,
  geode: 0,
};

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

const roundsUntilAfford = (
  recipe: Ingredients,
  supplies: Supplies,
  robots: Supplies
): number => {
  return Math.min(
    10000,
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

const canAfford = (recipe: Ingredients, supplies: Supplies): boolean => {
  if (!recipe) throw new Error("" + recipe);
  if (!supplies) throw new Error("" + supplies);
  return R.all(([item, cost]) => supplies[item] >= cost, recipe);
};

const harvest = (supplies: Supplies, robots: Supplies): void => {
  Object.entries(robots).forEach(([resource, harvest]) => {
    supplies[resource] += harvest;
  });
};

const buy = (recipe: Ingredients, supplies: Supplies): void => {
  recipe.forEach(([name, cost]) => {
    supplies[name] -= cost;
    // if (supplies[name] < 0) throw "oops in debt";
  });
};

const tellStory = (
  choices: [Resource, number][],
  blueprint: Blueprint
): void => {
  const supplies = { ...initSupplies };
  const robots = { ...initSupplies, ore: 1 };
  const choiceMinutes = {};
  choices.forEach(([resource, minute]) => (choiceMinutes[minute] = resource));
  for (const minute of R.range(1, 25)) {
    const buying = choiceMinutes[minute];
    if (buying) {
      buy(blueprint[buying], supplies);
    }
    harvest(supplies, robots);
    if (buying) {
      robots[buying] += 1;
    }
    const msg = `== Minute ${minute} ==
${robots.ore} ore-collecting robots; you now have ${supplies.ore} ore
${robots.clay} clay-collecting robots; use now have ${supplies.clay} clay.
${robots.obsidian} obsidian-collecting robots; you now have ${supplies.obsidian} obsidian.
${robots.geode} geode-cracking robots; you now have ${supplies.geode} geodes.

`;
    console.log(msg);
  }
};

const geodesInMinutes = (blueprint: Blueprint, time: number): number => {
  const node = solve(blueprint, time);
  return node[1].geode;
};

type Node = [number, Supplies, Supplies, [Resource, number][]]; // minutesLeft, supplies, robots, building
const solve = (blueprint: Blueprint, time: number): Node => {
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
  maxRequirements[GEODE] = 100000;
  console.log(maxRequirements);

  const nodes: Node[] = [];
  const seen = new Set<string>();
  let best: Node = [time, initSupplies, initRobots, []];
  let steps = 0;
  let seenSkip = 0;

  const counters: Record<number, number> = {};
  R.range(0, 10).forEach((n) => (counters[n] = 0));
  const getChoices = (minutes, supplies, robots, path): Node[] => {
    const choices = [];
    // If there isn't a way to to build enough geode to beat `best` then don't search this path
    const maxGeode =
      supplies.geode + (minutes * (minutes - 1)) / 2 + robots.geode * minutes;
    if (maxGeode < best[1].geode) {
      return [];
    }

    resources.forEach((resource) => {
      let counter = 0;
      counters[counter++] += 1;

      // skip if we have enough of this robot to build anything per turn
      if (maxRequirements[resource] <= robots[resource]) {
        return;
      }
      counters[counter++] += 1;

      // skip if we aren't making the stuff to build this robot
      if (R.any(([item, quantity]) => robots[item] == 0, blueprint[resource])) {
        return;
      }
      counters[counter++] += 1;

      const skipRounds =
        Math.max(roundsUntilAfford(blueprint[resource], supplies, robots), 0) +
        1;
      const mySupplies = { ...supplies };
      const myRobots = { ...robots };
      R.range(0, skipRounds).forEach(() => harvest(mySupplies, robots));
      const timeUntil = minutes - skipRounds;
      if (timeUntil < 0) {
        counters[counter + 2] += 1;
        return;
      }
      buy(blueprint[resource], mySupplies);
      // if (canAfford(blueprint[resource], mySupplies)) throw "oops waited too long"
      myRobots[resource] += 1;
      choices.push([
        timeUntil,
        mySupplies,
        myRobots,
        [...path, [resource, time - timeUntil]],
      ]);
      counters[counter] += 1;
    });
    if (robots.geode > 0) {
      // maybe just wait
      const mySupplies = { ...supplies };
      const myRobots = { ...robots };
      R.range(0, minutes).forEach(() => harvest(mySupplies, robots));
      choices.push([0, mySupplies, myRobots, path]);
    }
    return choices;
  };
  nodes.push([time, initSupplies, initRobots, []]);
  let limit = 8_000_000;
  while (nodes.length > 0) {
    limit--;
    steps++;
    if (limit <= 0) {
      console.log({ best, steps, seenSkip, counters });
      throw "oops limit";
    }
    const node = nodes.pop();
    const [minutes, supplies, robots, path] = node;
    // if (robots.obsidian > 0)
    // throw "oops obsidian " + minutes + JSON.stringify({ supplies, robots });
    if (minutes <= 0) {
      if (
        supplies.geode > best[1].geode ||
        (supplies.geode == best[1].geode &&
          supplies.obsidian > best[1].obsidian)
      ) {
        best = node;
        // console.log({ best });
      }
      continue;
    }
    for (const choice of getChoices(minutes, supplies, robots, path))
      nodes.push(choice);
  }
  console.log({ best, steps, seenSkip, counters, choices: best[3].join() });
  // tellStory(best[3], blueprint);
  return best;
};

const part1 = (input: Input) => {
  const MINUTES = 24;
  let total = 0;
  const values: number[] = input.map((blueprint) =>
    geodesInMinutes(blueprint, MINUTES)
  );
  console.log({ values });
  values.forEach((geodes, idx) => {
    total += (idx + 1) * geodes;
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

  it("know whne it can afford a thing", () => {
    const supplies = { ...initSupplies };
    const robots = { ...initSupplies, ore: 2, clay: 2 };
    const recipe: Ingredients = [
      [ORE, 3],
      [CLAY, 14],
    ];
    expect(roundsUntilAfford(recipe, supplies, robots)).toBe(7);
    expect(roundsUntilAfford(recipe, { ...supplies, clay: 6 }, robots)).toBe(4);
    expect(roundsUntilAfford(recipe, { ...supplies, clay: 7 }, robots)).toBe(4);
    expect(roundsUntilAfford(recipe, { ...supplies, clay: 8 }, robots)).toBe(3);
  });

  describe("geode harvest", () => {
    it("example from text", () => {
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

    it("line 1 of puzzle", () => {
      expect(geodesInMinutes(parse(data)[0], 24)).toBe(0);
    });

    it("line 23 of puzzle", () => {
      const blueprint = parse(data)[22];
      const solution = solve(blueprint, 24);
      expect(solution[1].geode).toBe(4);
    });
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(33);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(600);
      // 577 too low
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
