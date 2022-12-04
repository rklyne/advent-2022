import { text } from "./input"

const sum = (numbers: number[]): number => {
    return numbers.reduce((acc, n) => acc + n, 0)
}

const compute = (text: string) => {
    const elvesText = text.split("\n\n");
    const elvesCalorieText = elvesText.map((elf) => elf.trim().split("\n"));
    const elves: number[][] = elvesCalorieText.map(elf => elf.map((numberString) => parseInt(numberString)));
    const elfTotals: number[] = elves.map((calorieList) => sum(calorieList));
    const mostCalories = Math.max(...elfTotals);
    const topThreeElves = elfTotals.sort().reverse().slice(0, 3)
    return {elvesText, elvesCalorieText, elves, mostCalories, topThreeElves}
}

describe('', () => {
    it('part 1', () => {
        const {elvesText,elvesCalorieText, elves, mostCalories} = compute(text);
        expect(elves.length).toBe(257)
        expect(mostCalories).toBe("interesting")
    });
    it('part 2', () => {
        const {elves, topThreeElves} = compute(text);
        expect(elves.length).toBe(257)
        expect(sum(topThreeElves)).toBe("interesting")
    });
});
