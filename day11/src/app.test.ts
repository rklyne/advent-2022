import { BigInteger } from "jsbn";
import * as R from "ramda";
import { text, testData } from "./input";

class Item {
  private remainders: [number, number][];
  constructor(private n: number, moduli: number[]) {
    this.remainders = moduli.map((m) => [m, n % m]);
  }

  isDivisibleBy(n: number): boolean {
    if (this.n <= 10_000_000) {
      // tracking both ways because:
      // - part 1 only works with 'divide' support which I can't compute fast.
      // - part 2 requires the fast way which overflows normal 64 bit integers
      // - part 2 doesn't require division so I can hack it
      return this.n % n == 0
    }
    const pair = this.remainders.find((pair) => pair[0] == n);
    return pair[1] == 0;
  }

  add(n: number): void {
    this.n += n
    this.remainders = this.remainders.map(([mod, remain]) => [
      mod,
      (remain + n) % mod,
    ]);
  }

  multiply(n: number): void {
    this.n *= n
    this.remainders = this.remainders.map(([mod, remain]) => [
      mod,
      (remain * n) % mod,
    ]);
  }

  divide(n: number) {
    this.n = Math.floor(this.n / n)
    this.remainders = this.remainders.map(([mod, remain]) => [
      mod,
      Math.floor(remain / n) % mod,
    ]);
  }

  square(): void {
    this.n *= this.n
    this.remainders = this.remainders.map(([mod, remain]) => [
      mod,
      (remain * remain) % mod,
    ]);
  }
}

type Monkey = {
  items: Item[];
  op: (item: Item) => void;
  testMod: number;
  falseMonkey: number;
  trueMonkey: number;
  inspections: number;
};

const ZERO = new BigInteger("0");

const mod = (n: number, div: number): number => {
  // return bigInt(n).mod(div).toJSNumber();
  return n % div;
  const d = Math.floor(n / div);
  return n - d * div;
};

const parseOp = (opText: string): ((item: Item) => void) => {
  if (opText.includes("*")) {
    const parts = opText.split(" * ");
    if (parts[0] != "old") throw "first should be old";

    if (parts[1] == "old") return (old) => old.square();
    const n = parseInt(parts[1]);
    return (old) => old.multiply(n);
  }
  if (opText.includes("+")) {
    const parts = opText.split(" + ");
    if (parts[0] != "old") throw "first should be old";

    if (parts[1] == "old") return (old) => old.multiply(2);
    const n = parseInt(parts[1]);
    return (old) => old.add(n);
  }
  throw "unparsed op";
};

const parse = (text: string): Monkey[] => {
  const protoMonkeys = text.split("\n\n").map((monkeyText) => {
    const parts = monkeyText.split("\n");
    const op = parseOp(parts[2].split(" = ")[1]);
    const items = parts[1].split(": ")[1].split(", ");
    return {
      inspections: 0,
      items,
      op,
      testMod: parseInt(parts[3].split(" by ")[1]),
      falseMonkey: parseInt(parts[5].split("monkey ")[1]),
      trueMonkey: parseInt(parts[4].split("monkey ")[1]),
    };
  });
  const moduli: number[] = protoMonkeys.map((monkey) => monkey.testMod);
  return protoMonkeys.map((monkey) => ({
    ...monkey,
    items: monkey.items.map((s) => new Item(parseInt(s), moduli)),
  }));
};

const runRound = (monkeys: Monkey[], worryReduction = 3): Monkey[] => {
  const worry = new BigInteger("" + worryReduction);
  for (const monkey of monkeys) {
    monkey.inspections += monkey.items.length;
    for (const item of monkey.items) {
      monkey.op(item)
      item.divide(worryReduction);
      if (item.isDivisibleBy(monkey.testMod)) {
        monkeys[monkey.trueMonkey].items.push(item);
      } else {
        monkeys[monkey.falseMonkey].items.push(item);
      }
    }
    monkey.items = [];
  }

  return monkeys;
};

const part1 = (monkeys: Monkey[]): number => {
  for (const i of R.range(0, 20)) {
    runRound(monkeys);
  }
  const inspections = R.reverse(
    R.sortBy(R.identity)(monkeys.map((monkey) => monkey.inspections))
  );
  const [monkeyA, monkeyB] = inspections.slice(0, 2);
  return monkeyA * monkeyB;
};

const part2 = (monkeys: Monkey[]): number => {
  for (const i of R.range(0, 10_000)) {
    runRound(monkeys, 1);
  }
  const inspections = monkeys.map((monkey) => monkey.inspections);
  const sorted = R.reverse(R.sortBy(R.identity)(inspections));
  console.log({ inspections });
  const [monkeyA, monkeyB] = sorted.slice(0, 2);
  return monkeyA * monkeyB;
};

describe("day 11", () => {
  it("parses", () => {
    const testMonkey = parse(text)[0];
    expect(testMonkey).toStrictEqual(
      expect.objectContaining({
        testMod: 13,
        trueMonkey: 1,
        falseMonkey: 7,
      })
    );
  });

  it("one round", () => {
    expect(
      runRound(parse(testData)).map((monkey) => monkey.items)
    ).toStrictEqual([
      [20, 23, 27, 26],
      [2080, 25, 167, 207, 401, 1046],
      [],
      [],
    ]);
  });

  describe("part 1", () => {
    it("does the sample", () => {
      expect(part1(parse(testData))).toBe(10605);
    });
    it("does the problem", () => {
      expect(part1(parse(text))).toBe(66802);
    });
  });

  describe("part 2", () => {
    it("does the sample", () => {
      expect(part2(parse(testData))).toBe(2713310158);
    });
    it("does the problem", () => {
      expect(part2(parse(text))).toBe(21800916620);
    });
  });

  it("bigint", () => {
    expect(
      new BigInteger("59").mod(new BigInteger("4")).equals(new BigInteger("3"))
    ).toBeTruthy();
  });

  it("does big remainders", () => {
    const item = new Item(100, [3, 5, 7, 13]);
    expect(item.isDivisibleBy(5)).toBe(true);
    item.add(1);
    expect(item.isDivisibleBy(7)).toBe(false);
  });
});
