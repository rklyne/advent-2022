import * as R from "ramda";
import { parse, setup, Setup } from "./input";

const readMessage = (data: Setup) => {
  return data[0].map((stack) => stack[stack.length - 1]).join("");
};

const part1 = (data: Setup): string => {
  const [crateStacks, moves] = data;
  moves.forEach(([count, src, dest]) => {
    R.range(0, count).forEach(() =>
    crateStacks[dest-1].push(crateStacks[src-1].pop())
    )
  })
  return readMessage(data);
}

const part2 = (data: Setup): string => {
  const [crateStacks, moves] = data;
  moves.forEach(([count, src, dest]) => {
    const moving = []
    R.range(0, count).forEach(() =>
      moving.push(crateStacks[src-1].pop())
    )
    R.range(0, count).forEach(() =>
      crateStacks[dest-1].push(moving.pop())
    )
  })
  return readMessage(data);
}

describe("day 5", () => {
  it("setup worked", () => {
    const data = setup();
    expect(data[0][1]).toStrictEqual(["Q", "R", "B"]);
    const moves = data[1];
    expect(moves[0]).toStrictEqual([3, 8, 2]);
  });

  const testData = `    [D]    
[N] [C]    
[Z] [M] [P]
 1   2   3 

move 1 from 2 to 1
move 3 from 1 to 3
move 2 from 2 to 1
move 1 from 1 to 2`;

  it("can read a message", () => {
    expect(readMessage(parse(testData))).toBe("NDP");
  });

  describe("part 1", () => {
    it("can do the test example", () => {
      expect(part1(parse(testData))).toBe("CMZ");
    });
    it("can do the test example", () => {
      expect(part1(setup())).toBe("BZLVHBWQF");
    });
  });

  describe("part 2", () => {
    it("can do the test example", () => {
      expect(part2(parse(testData))).toBe("MCD");
    });
    it("can do the test example", () => {
      expect(part2(setup())).toBe("TDGJQTZSL");
    });
  });

});
