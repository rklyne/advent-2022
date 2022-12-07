import * as R from "ramda";
import { text } from "./input";

type File = [string, number];
type Dir = [File[], Record<string, Dir>];
type Ls = { cmd: "ls"; output: string };
type Cd = { cmd: "cd"; input: string };
type Command = Ls | Cd;

const newDir = (): Dir => [[], {}];

class Model {
  private rootDir: Dir;
  private currentDirs: Dir[];

  constructor() {
    this.rootDir = newDir();
    this.currentDirs = [this.rootDir];
  }

  learnFrom(command: Command): void {
    if (command.cmd == "cd") {
      this.cd(command.input);
    }
    if (command.cmd == "ls") {
      this.parseLs(command.output, this.currentDir());
    }
  }

  private currentDir(): Dir {
    return this.currentDirs[this.currentDirs.length - 1];
  }

  parseInput(text: string) {
    const commands = text.split("$ ").map((cmd) => cmd.trim());
    for (const commandText of commands) {
      if (commandText[0] == 'c') {
        this.learnFrom({cmd: "cd", input: commandText.split(" ")[1]});
      }
      if (commandText[0] == 'l') {
        this.learnFrom({cmd: "ls", output: commandText.slice(2).trim()});
      }
    }
  }

  private cd(input: string): void {
    const dirs = this.currentDir()[1];
    if (input == "..") {
      this.currentDirs.pop();
    } else if (input in dirs) {
      this.currentDirs.push(dirs[input]);
    } else {
      this.currentDirs.push(newDir());
      dirs[input] = this.currentDir();
    }
  }

  private parseLs(text: string, dir: Dir): void {
    text.split("\n").forEach((line) => {
      if (line[0] == "d") {
        return
      }
      const [sizeStr, name] = line.split(" ");
      dir[0].push([name, parseInt(sizeStr)]);
    });
  }

  dirSizes(): File[] {
    const addUp = (dir: Dir, prefix: string): File[] => {
      let myTotal: number = R.sum(dir[0].map((file) => file[1]));
      const results: File[] = [];

      for (const name in dir[1]) {
        const subdir: Dir = dir[1][name];
        addUp(subdir, prefix + name + "/").forEach((file) => {
          results.push(file);
          myTotal += file[1];
        });
      }
      results.push([prefix, myTotal])
      return results;
    };
    return addUp(this.rootDir, "");
  }
}

const part1 = (input: string): number => {
  let total = 0;
  const model = new Model();
  model.parseInput(input);
  for (const [name, size] of model.dirSizes()) {
    if (size <= 100000) {
      total += size
    }
  }
  return total
}

describe("", () => {
  it("can handle a ls command", () => {
    const model = new Model();
    model.learnFrom({ cmd: "ls", output: "123456 a" });
    expect(model.dirSizes()).toStrictEqual(
      expect.arrayContaining([["", 123456]])
    );
  });
  it("can do a total with ls", () => {
    const model = new Model();
    model.learnFrom({ cmd: "ls", output: "2123456 b\n3123456 c" });
    expect(model.dirSizes()).toStrictEqual(
      expect.arrayContaining([["", 2123456 + 3123456]])
    );
  });

  it("can cd", () => {
    const model = new Model();
    model.learnFrom({ cmd: "cd", input: "sub" });
    model.learnFrom({ cmd: "ls", output: "123456 a" });
    expect(model.dirSizes()).toStrictEqual(
      expect.arrayContaining([["sub/", 123456]])
    );
  });
  it("can cd ..", () => {
    const model = new Model();
    model.learnFrom({ cmd: "cd", input: "sub" });
    model.learnFrom({ cmd: "cd", input: ".." });
    model.learnFrom({ cmd: "ls", output: "123456 a" });
    expect(model.dirSizes()).toStrictEqual(
      expect.arrayContaining([["", 123456]])
    );
  });


  describe("part 1", () => {
    const testData = `$ cd /
$ ls
dir a
14848514 b.txt
8504156 c.dat
dir d
$ cd a
$ ls
dir e
29116 f
2557 g
62596 h.lst
$ cd e
$ ls
584 i
$ cd ..
$ cd ..
$ cd d
$ ls
4060174 j
8033020 d.log
5626152 d.ext
7214296 k`;

    it("can solve the sample", () => {
      expect(part1(testData)).toBe(95437)
    })

    it("has the answer", () => {
      expect(part1(text)).toBe(1444896)
    })
  })
});
