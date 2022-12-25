import * as R from "ramda";

import { data, testData } from "./input";

type Input = string[];

const parse = (text: string): Input => {
  return text
    .trim()
    .split("\n")
    .map((s) => s.trim());
};

const pairs = ["24", "13", "02", "-1", "=0"];

const fromSnafu = (s: string): number => {
  const s0 = s;
  for (const pair of pairs) {
    s = s.replace(new RegExp(pair[0], "g"), pair[1]);
  }
  return parseInt(s, 5) - parseInt("2".repeat(s.length), 5);
};

const toSnafu = (n: number): string => {
  const s0 = n.toString(5);
  let s = (n + parseInt("2".repeat(s0.length), 5)).toString(5);
  if (s.length != s0.length) {
    s = (n + parseInt("2".repeat(s0.length+1), 5)).toString(5);
  }
  for (const pair of R.reverse(pairs)) {
    s = s.replace(new RegExp(pair[1], "g"), pair[0]);
  }
  return s;
};

const part1 = (input: Input): string => {
  return toSnafu(R.sum(input.map(fromSnafu)));
};

const part2 = (input: Input): string => {
  return "0";
};

describe("day X", () => {
  it("fromSnafu", () => {
    expect(fromSnafu("1=-0-2")).toBe(1747);
    expect(fromSnafu("1=")).toBe(3);
    expect(fromSnafu("12")).toBe(7);
  });

  it("toSnafu", () => {
    expect(toSnafu(1747)).toBe("1=-0-2");
    expect(toSnafu(7)).toBe("12");
    expect(toSnafu(3)).toBe("1=");
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe("2=-1=0");
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe("2=10---0===-1--01-20");
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
