import * as R from "ramda";

import { data, testData } from "./input";

type Place = "#" | ".";
const ELF: Place = "#";
const SPACE: Place = ".";
type Input = Place[][]; // row, col

const isPlace = (s: string): s is Place => {
  return "#.".includes(s);
};

const parse = (text: string): Input => {
  return text.split("\n").map((line) => line.split("").filter(isPlace));
};

const elfToStr = ([row, col]: Coords): string => {
  return `${row},${col}`;
};

type Coords = [number, number];

class Field {
  elves: Record<string, Coords>;
  private directions: string[];

  constructor(public input: Input) {
    const elves: Coords[] = [];
    this.directions = "NSWE".split("");
    input.forEach((line, row) => {
      line.forEach((place, col) => {
        if (place == ELF) {
          elves.push([row, col]);
        }
      });
    });
    this.setElfPositions(elves);
  }

  private setElfPositions(elves: Coords[]): void {
    this.elves = {};
    elves.forEach((coords) => {
      this.elves[elfToStr(coords)] = coords;
    });
  }

  getDimensions() {
    const [rows, cols] = R.transpose(Object.values(this.elves));
    const minY = Math.min(...rows);
    const maxY = Math.max(...rows) + 1;
    const minX = Math.min(...cols);
    const maxX = Math.max(...cols) + 1;
    const width = maxX - minX;
    const height = maxY - minY;
    return { width, height, minX, maxX, minY, maxY };
  }

  getFieldSize(): number {
    const { width, height } = this.getDimensions();
    return height * width;
  }

  runStep(): number {
    const proposals: Record<string, Coords> = {};
    const staying: Record<string, Coords> = {};
    const registered: Set<string> = new Set();
    const blocked: Set<string> = new Set();
    Object.entries(this.elves).forEach(([elfId, coord]) => {
      // calculate destination
      const dest = this.moveFrom(coord);
      if (dest) {
        proposals[elfId] = dest;
        const destId = elfToStr(dest);
        // IF empty, register interest
        if (!registered.has(destId)) {
          registered.add(destId);
          // console.log(`registered ${destId} for ${elfId}`)
        } else {
          blocked.add(destId);
          // console.log(`blocked ${destId} for ${elfId}`)
        }
        // ELSE block move to destination
        //
      } else {
        // otherwise stay
        staying[elfId] = coord;
        blocked.add(elfId);
      }
    });
    // Calculate new positions with all unblocked moves
    const elves: Coords[] = [];

    let movedElves = 0;
    Object.entries(proposals)
      .concat(Object.entries(staying))
      .forEach(([elfId, destCoord]) => {
        const destId = elfToStr(destCoord);
        if (blocked.has(destId)) {
          elves.push(this.elves[elfId]);
        } else {
          movedElves++;
          elves.push(destCoord);
        }
      });
    if (elves.length != new Set(elves).size) {
      throw "oops overlapping elves";
    }
    // console.log({ previous: Object.values(this.elves), elves });
    const elvesBefore = this.elves.length;
    this.setElfPositions(elves);
    const elvesAfter = this.elves.length;
    const newElves = elves.length;
    if (elvesAfter != elvesBefore) {
      console.log({
        elvesBefore,
        newElves,
        elvesAfter,
        elves,
      });
      throw "oops lost+found elves";
    }
    this.cycleDirections();
    return movedElves;
  }

  private cycleDirections(): void {
    this.directions = [...this.directions.slice(1), this.directions[0]];
  }

  private elfAt(coord: Coords): boolean {
    return elfToStr(coord) in this.elves;
  }

  private moveFrom(coord: Coords): Coords {
    const offsets = [-1, 0, 1];

    let adjacentElf = false;
    for (const x of offsets) {
      for (const y of offsets) {
        if (x == 0 && y == 0) continue;
        if (this.elfAt([coord[0] + x, coord[1] + y])) {
          adjacentElf = true;
          break;
        }
      }
      if (adjacentElf) break;
    }
    if (!adjacentElf) return;

    for (const direction of this.directions) {
      // N => [-1, 0]
      if (
        direction == "N" &&
        !R.any(
          (offset) => this.elfAt([coord[0] - 1, coord[1] + offset]),
          offsets
        )
      ) {
        return [coord[0] - 1, coord[1]];
      }
      // S => [1, 0]
      if (
        direction == "S" &&
        !R.any(
          (offset) => this.elfAt([coord[0] + 1, coord[1] + offset]),
          offsets
        )
      ) {
        return [coord[0] + 1, coord[1]];
      }
      // W => [0, -1]
      if (
        direction == "W" &&
        !R.any(
          (offset) => this.elfAt([coord[0] + offset, coord[1] - 1]),
          offsets
        )
      ) {
        return [coord[0], coord[1] - 1];
      }
      // E => [0, 1]
      if (
        direction == "E" &&
        !R.any(
          (offset) => this.elfAt([coord[0] + offset, coord[1] + 1]),
          offsets
        )
      ) {
        return [coord[0], coord[1] + 1];
      }
    }
  }

  public print(): void {
    const { minX, maxX, minY, maxY } = this.getDimensions();

    const text = R.range(minY, maxY + 1)
      .map((row) =>
        R.range(minX, maxX + 1)
          .map((col) => (this.elfAt([row, col]) ? ELF : SPACE))
          .join("")
      )
      .join("\n");
    console.log(this.getDimensions());
    console.log(text);
  }

  public elfCount(): number {
    return Object.keys(this.elves).length;
  }
}

const part1 = (input: Input) => {
  const STEPS = 10;
  const field = new Field(input);
  // field.print();
  R.range(0, STEPS).forEach(() => {
    const moved = field.runStep();
    // console.log({ moved });
    // field.print();
  });
  // field.print()
  return field.getFieldSize() - field.elfCount();
};

const part2 = (input: Input) => {
  let steps = 0;
  const field = new Field(input);
  // field.print();
  while (true) {
    steps += 1;
    if (steps > 10_000) break
    const moved = field.runStep();
    if (moved == 0) break;
    // field.print();
  }
  // field.print()
  return steps
};

describe("day X", () => {
  it("parses", () => {
    expect(parse(testData)[0].join("")).toStrictEqual("....#..");
  });

  describe.skip("small example", () => {
    const smallExample = `
      .....
      ..##.
      ..#..
      .....
      ..##.
      .....
    `
      .replace(/ /g, "")
      .trim();
    it("sample", () => {
      expect(part1(parse(smallExample))).toBe(110);
    });

    it.skip("answer", () => {
      expect(part1(parse(data))).toBe(-1);
    });
  });

  describe("part 1", () => {
    it("sample", () => {
      expect(part1(parse(testData))).toBe(110);
    });

    it("answer", () => {
      expect(part1(parse(data))).toBe(3987);
      // 6724 too high
      // 6400 too high
    });
  });

  describe("part 2", () => {
    it("sample", () => {
      expect(part2(parse(testData))).toBe(20);
    });

    it("answer", () => {
      expect(part2(parse(data))).toBe(938);
    });
  });
});
