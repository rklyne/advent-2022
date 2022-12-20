import * as R from "ramda";

import { data, testData } from "./input";

const parse = (text: string) => {
}

const part1 = (input: any) => {
  return 0
}

const part2 = (input: any) => {
  return 0
}

describe('day X', () => {
    it('fails', () => {
        expect(false).toBe(true);
    });

  describe.skip("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(-1)
    })

    it("answer", () => {
      expect(part1(parse(data))).toBe(-1)
    })
  })

  describe.skip("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(-1)
    })

    it("answer", () => {
      expect(part2(parse(data))).toBe(-1)
    })
  })
});
