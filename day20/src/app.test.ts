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

const part2 = (input: Input) => {
  const MULT = 811589153;
  const MOD = input.length - 1;
  const INPUT_MULT = MULT % MOD;
  const mungedInput = input.map((n, idx) =>
    n == 0 ? 0 : ((n * INPUT_MULT) % MOD) + idx * MOD
  );
  if (new Set(mungedInput).size != input.length) throw "oops nonunique";

  const mixed = mix(mungedInput, 10);
  const offset = mixed.indexOf(0);
  const unmunged = mixed.map((n) => input[mungedInput.indexOf(n)]);
  const n1 = numAt(1000 + offset, unmunged);
  const n2 = numAt(2000 + offset, unmunged);
  const n3 = numAt(3000 + offset, unmunged);
  console.log({
    n1,
    n2,
    n3,
    mixed,
    offset,
    MULT,
    MOD,
    h: Math.max(...mungedInput),
  });
  return (n1 + n2 + n3) * MULT;
};

type Data = number[];
const mix = (initial: Data, count = 1): Data => {
  let next = [...initial];
  const len = initial.length;

  R.range(0, count).forEach(() => {
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

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(1623178306);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(861907680486);
      // not -1919408346845
      // not 11732332795768
      // not 7070564700936
    });
  });
});
