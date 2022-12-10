import * as R from "ramda";

type TimerData = {
  name: string;
  spans: number[];
  count: number;
};
export class Timer {
  private timers: TimerData[];
  constructor() {
    this.timers = [];
    this.reset();
  }

  private newTimerData(name: string) {
    for (const timer of this.timers) {
      if (timer.name == name) {
        return timer;
      }
    }
    const data: TimerData = {
      name: name,
      spans: [],
      count: 0,
    };
    this.timers.push(data);
    return data;
  }

  reset() {
    this.timers.forEach((timer) => {
      timer.count = 0;
      timer.spans = [];
    });
  }

  print() {
    console.log("name: count calls, avg, max, min");
    console.log(
      this.timers.map((timer) => {
        const avg = R.sum(timer.spans) / timer.count;
        const max = Math.max(...timer.spans);
        const min = Math.min(...timer.spans);
        return `${timer.name}: ${timer.count} calls, ${avg}, ${max}, ${min}`;
      })
    );
  }

  timed<Args extends any[], Return>(
    f: (...args: Args) => Return
  ): (...args: Args) => Return {
    const name = f.name;
    const data = this.newTimerData(name);
    const newTimer = (...args: Args) => {
      const start = new Date().getTime();
      try {
        return f(...args);
      } finally {
        data.spans.push(new Date().getTime() - start);
        data.count++;
      }
    };
    return newTimer;
  }
}
