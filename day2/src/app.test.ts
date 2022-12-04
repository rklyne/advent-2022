import { data } from "./input";

type Input = typeof data;

type RPS = "rock" | "paper" | "scissors";
const rock: RPS = "rock";
const paper: RPS = "paper";
const scissors: RPS = "scissors";
type Result = "win" | "lose" | "draw";

const resultForLeft = (left: RPS, right: RPS): Result => {
  if (left == right) return "draw";
  if (left == "rock") {
    return right == "scissors" ? "win" : "lose";
  }
  if (left == "paper") {
    return right == "rock" ? "win" : "lose";
  }
  return right == "paper" ? "win" : "lose";
};

const playScore: Record<RPS, number> = {
  rock: 1,
  paper: 2,
  scissors: 3,
};
const resultScore: Record<Result, number> = {
  win: 6,
  draw: 3,
  lose: 0,
};

type Instruction = "X" | "Y" | "Z";
const myPlayDay1 = (instruction: Instruction, theirPlay): RPS => {
  const myPlayMap = {
    X: rock,
    Y: paper,
    Z: scissors,
  };
  return myPlayMap[instruction];
};
const myPlayDay2 = (instruction: Instruction, theirPlay): RPS => {
  const outcomeMap: Record<Instruction, Result> = {
    X: "lose",
    Y: "draw",
    Z: "win",
  };
  const outcome = outcomeMap[instruction];
  for (const x of [rock, paper, scissors]) {
    if (resultForLeft(x, theirPlay) == outcome) {
      return x;
    }
  }
  throw new Error("shouldn't happen");
};

const calculateMyScore = (input: Input, mapMyPlay = myPlayDay1, print=false): number => {
  let score = 0;
  const theirPlayMap = {
    A: rock,
    B: paper,
    C: scissors,
  };
  for (const [them, me] of input) {
    const theirPlay: RPS = theirPlayMap[them];
    const myPlay: RPS = mapMyPlay(me, theirPlay);
    const result: Result = resultForLeft(myPlay, theirPlay);
    if (print) {
      console.log({theirPlay, myPlay, result, them, me})
    }
    score += playScore[myPlay] + resultScore[result];
  }
  return score;
};

describe("day 2", () => {
  it("knows when it's a draw", () => {
    expect(resultForLeft("rock", "rock")).toBe("draw");
    expect(resultForLeft("paper", "paper")).toBe("draw");
    expect(resultForLeft("scissors", "scissors")).toBe("draw");
  });
  it("knows which wins in rock paper scissors", () => {
    expect(resultForLeft("paper", "rock")).toBe("win");
    expect(resultForLeft("rock", "paper")).toBe("lose");
    expect(resultForLeft("scissors", "paper")).toBe("win");
    expect(resultForLeft("paper", "scissors")).toBe("lose");
    expect(resultForLeft("rock", "scissors")).toBe("win");
    expect(resultForLeft("scissors", "rock")).toBe("lose");
  });

  const testData: Input = [
    ["A", "Y"],
    ["B", "X"],
    ["C", "Z"],
  ];

  describe("part 1", () => {
    it("can calculate a score in the test example", () => {
      expect(calculateMyScore(testData)).toBe(15);
    });

    it("answer part 1", () => {
      expect(calculateMyScore(data)).toBe(13484);
    });
  });
  describe("part 2", () => {
    it("can calculate a score in the test example", () => {
      expect(calculateMyScore(testData, myPlayDay2)).toBe(12);
    });

    it("answer part 2", () => {
      expect(calculateMyScore(data, myPlayDay2)).toBe(13433);
    });
  });
});
