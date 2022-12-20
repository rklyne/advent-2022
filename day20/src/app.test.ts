import * as R from "ramda";

import { data, testData } from "./input";

const parse = (text: string): Input => {
  return text.split("\n").map((s) => parseInt(s));
};

type Input = number[];

const numAt = (n: number, data: Input): number => {
  return data[n % data.length];
};

const part1 = (input: Input) => {
  const mixed = mix([...input]);
  const offset = mixed.indexOf(0);
  const n1 = numAt(1000 + offset, mixed);
  const n2 = numAt(2000 + offset, mixed);
  const n3 = numAt(3000 + offset, mixed);
  // console.log({ n1, n2, n3, mixed, offset });
  return n1 + n2 + n3;
};

const part2 = (input: any) => {
  return 0;
};

type Data = number[];
const mix = (initial: Data): Data => {
  let next = [...initial];
  const len = initial.length;
  initial.forEach((x) => {
    const idx = next.indexOf(x);
    const prev = [...next];
    const wrapIdx = (n) => (n + (len - 1)) % (len - 1);
    const newIdx = wrapIdx(x);
    const tmp = [...next.slice(idx + 1), ...next.slice(0, idx)];
    if (tmp.length != len - 1) throw "oops bad tmp";

    next = [...tmp.slice(0, newIdx), x, ...tmp.slice(newIdx)];

    // console.log(`${x} [${newIdx}]: ${prev} -> ${tmp} -> ${next}`)
    if (initial.length != next.length) throw "oops bad move";
  });
  return next;
};

describe("day X", () => {
  it("mixes", () => {
    expect(mix([1, 2, -3, 3, -2, 0, 4])).toStrictEqual([-2, 1, 2, -3, 4, 0, 3]);
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(3);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(4224);
    });
  });

  describe.skip("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(-1);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(-1);
    });
  });
});
