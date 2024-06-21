import { TimeRange } from '../dto/time-range.dto';
import { DateTime } from 'luxon';

export function lastUtcDayRange(base?: Date): TimeRange {
  return prevNthUtcDayRange(1, base);
}

export function todayUtcDayRange(base?: Date): TimeRange {
  return prevNthUtcDayRange(0, base);
}

export function getDateStart(date: Date): Date {
  return todayUtcDayRange(date).start_from;
}

export function prevNthUtcDayRange(prev: number, base?: Date) {
  const now = base ?? new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start_from = new Date(end.getTime() - prev * 24 * 60 * 60 * 1000);
  const end_to = new Date(end.getTime() - (prev - 1) * 24 * 60 * 60 * 1000);
  return {
    start_from,
    end_to,
  };
}


export function prevUtcDaysRange(prev: number, base?: Date): TimeRange {
  const { start_from, end_to } = prevNthUtcDayRange(prev, base);

  return {
    start_from,
    end_to: new Date(end_to.getTime() + (prev - 1) * 24 * 60 * 60 * 1000),
  };
}

export function currentHourDate(base?: Date): Date {
  const now = base ?? new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
    ),
  );
}

export function lastHourRange(base?: Date): TimeRange {
  const now = base ?? new Date();
  const end = currentHourDate(now);
  const start_from = new Date(end.getTime() - 60 * 60 * 1000);
  return {
    start_from,
    end_to: end,
  };
}

export function moveTimeRange(range: TimeRange, delta: number): TimeRange {
  return {
    start_from: new Date(range.start_from.getTime() + delta),
    end_to: new Date(range.end_to.getTime() + delta),
  };
}


type GroupedValue<V> = TimeRange & {
  values: V[];
};

export function groupRangeValues<I extends TimeRange>(
  infos: I[],
  unit: 'day',
): GroupedValue<I>[] {
  infos = [...infos].sort(
    (a, b) => a.start_from.getTime() - b.start_from.getTime(),
  );

  const groupedValues: GroupedValue<I>[] = [];

  const getKey = (date: Date) => {
    switch (unit) {
      case 'day': {
        const d = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
          ),
        );
        return `${d.toISOString()}+${24 * 60 * 60 * 1000}`;
      }
      default:
        throw new Error(`Unknown unit: ${unit}`);
    }
  };

  let currKey: string = '';
  let values: I[] = [];

  for (const info of infos) {
    const key = getKey(info.start_from);
    if (!currKey) {
      currKey = key;
      values = [info];
    } else if (currKey == key) {
      values.push(info);
    } else {
      const [isoStart, range] = currKey.split('+');

      groupedValues.push({
        start_from: new Date(isoStart),
        end_to: new Date(new Date(isoStart).getTime() + +range),
        values: values,
      });
      currKey = key;
      values = [info];
    }
  }
  if (currKey) {
    const [isoStart, range] = currKey.split('+');
    groupedValues.push({
      start_from: new Date(isoStart),
      end_to: new Date(new Date(isoStart).getTime() + +range),
      values: values,
    });
  }
  return groupedValues;
}

export function isInRange(date: Date, range: TimeRange): boolean {
  return (
    date.getTime() >= range.start_from.getTime() &&
    date.getTime() < range.end_to.getTime()
  );
}

export function isRangeContinus(...ranges: TimeRange[]) {
  if (ranges.length < 2) {
    return true;
  }
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i - 1].end_to.getTime() != ranges[i].start_from.getTime()) {
      return false;
    }
  }
  return true;
}

export function fillMissingRanges<V extends TimeRange>(
  values: V[],
  options: {
    maxRangeDur?: number;
    onCreate: (range: TimeRange) => Omit<V, keyof TimeRange>;
  },
): V[] {
  const { maxRangeDur, onCreate } = options;

  values = [...values].sort(
    (a, b) => a.start_from.getTime() - b.start_from.getTime(),
  );
  if (values.length < 2) return values;

  const result: V[] = [values[0]];

  let prev_end: Date = values[0].end_to;

  for (let next of [...values.slice(1)]) {
    if (prev_end.getTime() == next.start_from.getTime()) {
      result.push(next);
      prev_end = next.end_to;
    } else {
      while (prev_end.getTime() < next.start_from.getTime()) {
        const newRangeStart = new Date(prev_end.getTime());
        const newRangeEnd = new Date(
          maxRangeDur
            ? Math.max(
                newRangeStart.getTime() + maxRangeDur,
                next.start_from.getTime(),
              )
            : next.start_from.getTime(),
        );

        const newRange = {
          start_from: newRangeStart,
          end_to: newRangeEnd,
        };
        const newInfo = onCreate(newRange);
        const createdValue = {
          ...newInfo,
          ...newRange,
        } as V;
        result.push(createdValue);
        prev_end = createdValue.end_to;
      }
    }
  }

  
  // if (startDate) {
  //   let prev_end = startDate;

  // }
  
  // if (endDate) {
  //   while (prev.end_to.getTime() < endDate.getTime()) {
  //     const newRangeStart = new Date(prev.end_to.getTime());
  //     const newRangeEnd = new Date(
  //       Math.max(newRangeStart.getTime() + maxRangeDur, endDate.getTime()),
  //     );

  //     const newRange = {
  //       start_from: newRangeStart,
  //       end_to: newRangeEnd,
  //     };
  //     const newInfo = onCreate(newRange);
  //     const createdValue = {
  //       ...newInfo,
  //       ...newRange,
  //     } as V;
  //     result.push(createdValue);
  //     prev = createdValue;
  //   }
  // }

  return result;
}

export function makeContinousRanges<V extends TimeRange>(options: {
  startFrom: Date;
  endTo: Date;
  maxRangeDur: number;
  onCreate: (range: TimeRange) => Omit<V, keyof TimeRange>;
}): V[] {
  const { startFrom, endTo, maxRangeDur, onCreate } = options;

  let prev_end = startFrom;
  const padded: V[] = [];
  while (prev_end.getTime() < endTo.getTime()) {
    const newRangeStart = new Date(prev_end.getTime());
    const newRangeEnd = new Date(
      Math.min(newRangeStart.getTime() + maxRangeDur, endTo.getTime()),
    );

    const newRange = {
      start_from: newRangeStart,
      end_to: newRangeEnd,
    };
    const newInfo = onCreate(newRange);
    const createdValue = {
      ...newInfo,
      ...newRange,
    } as V;
    padded.push(createdValue);
    prev_end = createdValue.end_to;
  }

  return padded;
}

export function getDayDuration(date: Date) {
  const start = DateTime.fromJSDate(date).setZone('UTC').startOf('day');
  const end = DateTime.fromJSDate(date).setZone('UTC').endOf('day');

  return {
    start: start.toJSDate(),
    end: end.toJSDate(),
  };
}
