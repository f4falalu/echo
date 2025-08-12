export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  progress: number;
  status: "relationship" | "complicated" | "single";
  subRows?: Person[];
};

const range = (len: number): number[] => {
  const arr: number[] = [];
  for (let i = 0; i < len; i += 1) arr.push(i);
  return arr;
};

const makePerson = (num: number): Person => {
  const statuses: Person["status"][] = ["relationship", "complicated", "single"];
  return {
    id: num,
    firstName: `First${num}`,
    lastName: `Last${num}`,
    age: (num % 40) + 1,
    visits: (num * 17) % 1_000,
    progress: (num * 7) % 100,
    status: statuses[num % statuses.length],
  };
};

export function makeData(...lens: number[]): Person[] {
  const makeDataLevel = (depth = 0): Person[] => {
    const len = lens[depth] ?? 0;
    return range(len).map((index): Person => {
      return {
        ...makePerson(index),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      };
    });
  };

  return makeDataLevel();
}

