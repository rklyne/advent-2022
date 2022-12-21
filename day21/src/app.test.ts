import * as R from "ramda";

import { data, testData } from "./input";

type Op = "+" | "-" | "/" | "*";
type BinOp<T extends Op> = { op: T; l: string; r: string };
type Add = BinOp<"+">;
type Mult = BinOp<"*">;
type Subtract = BinOp<"-">;
type Divide = BinOp<"/">;
type Const = { op: "c"; value: number };
type Instruction = [string, Const | Mult | Divide | Add | Subtract];
type Input = Instruction[];

const isOp = (s: string): s is Op => {
  return ["*", "/", "+", "-"].includes(s);
};

const parse = (text: string): Input => {
  return text.split("\n").map((line) => {
    // dsdj: hjhs - mcgt
    const [name, sum] = line.split(": ");
    if (sum.includes(" ")) {
      const parts = sum.split(" ");
      const op = parts[1];
      if (!isOp(op)) throw "oops op";
      return [name, { op, l: parts[0], r: parts[2] }];
    } else {
      return [name, { op: "c", value: parseInt(sum) }];
    }
  });
};

type Getter = Promise<number>;
type Setter = (n: number) => void;

const makeValues = (
  log = false
): [Record<string, [Getter, Setter]>, (name: string) => [Getter, Setter]] => {
  const values: Record<string, [Getter, Setter]> = {};
  const valueAccessors = (name: string): [Getter, Setter] => {
    if (!(name in values)) {
      let s: Setter;
      const g = new Promise<number>((resolve: Setter) => {
        s = (n) => {
          if (log) {
            console.log(`setting ${name} to ${n}`);
          }
          resolve(n);
        };
      });
      if (!s) throw "oops promise";
      values[name] = [g, s];
    }
    return values[name];
  };
  return [values, valueAccessors];
};

const solveFor = async (input: Input, rootName = "root") => {
  const [values, valueAccessors] = makeValues();
  for (const [name, op] of input) {
    const access = valueAccessors(name);
    if (op.op == "c") {
      access[1](op.value);
    } else {
      const f = async (): Promise<number> => {
        const l = await valueAccessors(op.l)[0];
        const r = await valueAccessors(op.r)[0];
        if (op.op == "+") return l + r;
        if (op.op == "-") return l - r;
        if (op.op == "*") return l * r;
        if (op.op == "/") return l / r;
      };
      f().then((n) => access[1](n));
    }
  }
  return await valueAccessors(rootName)[0];
};

const whoNotReady = async <T>(
  left: Promise<T>,
  right: Promise<T>,
  me: Promise<T>
): Promise<"left" | "right" | "me"> => {
  const winners: string[] = [];
  const lp = left.then(() => {
    winners.push("left");
  });
  const rp = right.then(() => {
    winners.push("right");
  });
  const mp = me.then(() => {
    winners.push("me");
  });
  await Promise.race([
    Promise.all([lp, rp]),
    Promise.all([lp, mp]),
    Promise.all([mp, rp]),
  ]);
  if (winners.length != 2) throw "oops race";
  if (!winners.includes("me")) return "me"
  if (!winners.includes("left")) return "left"
  if (!winners.includes("right")) return "right"
  throw "oops race result"
};

const solveBackwardsFor = async (input: Input, solveName = "humn") => {
  const rootName = "root";
  const [values, valueAccessors] = makeValues(false);
  for (const [name, op] of input) {
    const access = valueAccessors(name);
    if (op.op == "c") {
      if (name != solveName) access[1](op.value);
    } else {
      const f = async (): Promise<void> => {
        const lPromise = valueAccessors(op.l)[0];
        const rPromise = valueAccessors(op.r)[0];
        const mPromise = access[0];
        if (name == "root") {
          const lmr = await whoNotReady(lPromise, rPromise, Promise.resolve(0));
          // override for "="
          if (lmr == "right") {
            // console.log("... root l setting " + op.r);
            valueAccessors(op.r)[1](await lPromise);
            // console.log(">>> root l setting " + op.r);
          } else {
            // console.log("... root r setting " + op.l);
            valueAccessors(op.l)[1](await rPromise);
            // console.log(">>> root r setting " + op.l);
          }
          return;
        }
        const lmr = await whoNotReady(lPromise, rPromise, mPromise);
        const calc = async () => {
          if (lmr == "me") {
            const l = await lPromise;
            const r = await rPromise;
            if (op.op == "+") return l + r;
            if (op.op == "-") return l - r;
            if (op.op == "*") return l * r;
            if (op.op == "/") return l / r;
          } else if (lmr == "right") {
            const l = await lPromise;
            const me = await mPromise;
            // ME = L <op> R
            // ...
            // R = ?
            if (op.op == "+") return me - l;
            if (op.op == "-") return l - me;
            if (op.op == "*") return me / l;
            if (op.op == "/") return l / me;
          } else {
            const r = await rPromise;
            const me = await mPromise;
            // ME = L <op> R
            // ...
            // R = ?
            if (op.op == "+") return me - r;
            if (op.op == "-") return me + r;
            if (op.op == "*") return me / r;
            if (op.op == "/") return me * r;
          }
          throw "oops no result??";
        };
        // console.log(`... at ${name} setting ${lmr} to ???`)
        const n = await calc()
        if (lmr == "right") {
          // console.log(`>>> at ${name} setting ${lmr} ${op.r} to ${n}`)
          valueAccessors(op.r)[1](n);
        } else if (lmr == "left") {
          // console.log(`>>> at ${name} setting ${lmr} ${op.l} to ${n}`)
          valueAccessors(op.l)[1](n);
        } else {
          // console.log(`>>> at ${name} setting ${lmr} to ${n}`)
          access[1](n);
        }
      };
      f();
    }
  }
  // valueAccessors(rootName)[1](0);
  return await valueAccessors(solveName)[0];
};

const part1 = async (input: Input): Promise<number> => {
  return await solveFor(input, "root");
};

const part2 = async (input: Input): Promise<number> => {
  const solve = await solveBackwardsFor(input, "humn");
  return solve;
};

describe("day X", () => {
  it("parses", () => {
    expect(parse(testData)[0]).toStrictEqual([
      "root",
      { op: "+", l: "pppw", r: "sjmn" },
    ]);
  });

  describe("part 1", () => {
    it("sample", async () => {
      expect(await part1(parse(testData))).toBe(152);
    }, 1000);

    it("answer", async () => {
      expect(await part1(parse(data))).toBe(256997859093114);
    }, 1000);
  });

  describe("part 2", () => {
    it("sample", async () => {
      expect(await part2(parse(testData))).toBe(301);
    }, 1000);

    it("answer", async () => {
      expect(await part2(parse(data))).toBe(3952288690726);
      // higher than 150
    }, 1000);
  });
});
