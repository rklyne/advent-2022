import * as R from "ramda";
import { data } from "./input";

type Item = number | Item[];
type Packet = Item
type Pair = [Packet, Packet];

const parse = (text: string): Pair[] => {
  const parsePair = (pair: string): Pair => {
    const lines = pair.split("\n");
    return [eval(lines[0]), eval(lines[1])];
  };
  return text.split("\n\n").map(parsePair);
};

const inOrder = (pair: Pair): boolean | null => {
  const lArray = Array.isArray(pair[0]);
  const rArray = Array.isArray(pair[1]);
  if (!lArray && !rArray) {
    if (pair[0] == pair[1]) {
      return null;
    }
    return pair[0] < pair[1];
  }
  if (!lArray) return inOrder([[pair[0]], pair[1]]);
  if (!rArray) return inOrder([pair[0], [pair[1]]]);
  return inOrderLists(pair[0] as Item[], pair[1] as Item[]);
};
const inOrderLists = (l: Item[], r: Item[]): boolean | null => {
  for (const newPair of R.zip(l, r)) {
    const pairResult = inOrder(newPair);
    if (pairResult != null) return pairResult
  }
  if (l.length < r.length) return true;
  if (l.length > r.length) return false;
  return null;
};

const part1 = (pairs: Pair[]): number => {
  let total = 0;
  for (const idx of R.range(0, pairs.length)) {
    if (inOrder(pairs[idx])) {
      total += idx + 1;
    }
  }
  return total;
};

const part2 = (pairs: Pair[]): number => {
  const packets: Packet[] = R.reduce((packets1, packets2) => packets1.concat(packets2), [], pairs).concat([[[2]], [[6]]])
  const sorted = packets.sort((l: Packet, r: Packet) => {
    const cmp = inOrder([l, r]);
    if (cmp == false) return 1
    if (cmp == true) return -1
    return 0
  })
  const strings = sorted.map(packet => JSON.stringify(packet))
  const idx1 = strings.indexOf("[[2]]") + 1
  const idx2 = strings.indexOf("[[6]]") + 1
  return idx1 * idx2
};

describe("day 13", () => {
  it("parses", () => {
    expect(parse(data)[0]).toStrictEqual([
      [],
      [
        [
          6,
          [4, [4, 10, 7]],
          [[0, 8, 6], 2],
          [[], 8, [7, 10, 6, 4, 2], [10, 10], 6],
          4,
        ],
      ],
    ]);
  });

  it.each([
    [[[1], [2]] as Pair,true],
    [
      [
        [1, 1, 3, 1, 1],
        [1, 1, 5, 1, 1],
      ] as Pair,
      true,
    ],
    [
      [
        [[1], [2, 3, 4]],
        [[1], 4],
      ] as Pair,
      true,
    ],
    [[[9], [[8, 7, 6]]] as Pair, false],
    [
      [
        [[4, 4], 4, 4],
        [[4, 4], 4, 4, 4],
      ] as Pair,
      true,
    ],
    [
      [
        [7, 7, 7, 7],
        [7, 7, 7],
      ] as Pair,
      false,
    ],
    [[[], [3]] as Pair, true],
    [[[[[]]], [[]]] as Pair, false],
    [
      [
        [1, [2, [3, [4, [5, 6, 7]]]], 8, 9],
        [1, [2, [3, [4, [5, 6, 0]]]], 8, 9],
      ] as Pair,
      false,
    ],
  ])("inOrder(%o) => %s", (pair: Pair, isRight: boolean) => {
    expect(inOrder(pair)).toBe(isRight);
  });

  const testData = `[1,1,3,1,1]
  [1,1,5,1,1]

  [[1],[2,3,4]]
  [[1],4]

  [9]
  [[8,7,6]]

  [[4,4],4,4]
  [[4,4],4,4,4]

  [7,7,7,7]
  [7,7,7]

  []
  [3]

  [[[]]]
  [[]]

  [1,[2,[3,[4,[5,6,7]]]],8,9]
  [1,[2,[3,[4,[5,6,0]]]],8,9]`.replace(/ /g, "");

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(13);
    });
    it("answer", () => {
      expect(part1(parse(data))).toBe(5720);
    });
  });

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(140);
    });
    it("answer", () => {
      expect(part2(parse(data))).toBe(23504);
    });
  });
});
