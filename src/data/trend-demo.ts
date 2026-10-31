export interface WeightPoint {
  day: number;
  date: string;
  rawWeight: number;
  trendWeight: number;
}

// 30 days of realistic weigh-ins: 78.2 kg down to 75.8 kg with natural water noise
export const TREND_DEMO_DATA: WeightPoint[] = [
  { day: 1, date: "Oct 1", rawWeight: 78.2, trendWeight: 78.2 },
  { day: 2, date: "Oct 2", rawWeight: 78.6, trendWeight: 78.16 },
  { day: 3, date: "Oct 3", rawWeight: 77.9, trendWeight: 78.11 },
  { day: 4, date: "Oct 4", rawWeight: 78.4, trendWeight: 78.07 },
  { day: 5, date: "Oct 5", rawWeight: 77.8, trendWeight: 78.01 },
  { day: 6, date: "Oct 6", rawWeight: 78.1, trendWeight: 77.96 },
  { day: 7, date: "Oct 7", rawWeight: 77.6, trendWeight: 77.9 },
  { day: 8, date: "Oct 8", rawWeight: 77.4, trendWeight: 77.83 },
  { day: 9, date: "Oct 9", rawWeight: 78.1, trendWeight: 77.78 },
  { day: 10, date: "Oct 10", rawWeight: 77.5, trendWeight: 77.72 },
  { day: 11, date: "Oct 11", rawWeight: 77.1, trendWeight: 77.64 },
  { day: 12, date: "Oct 12", rawWeight: 77.8, trendWeight: 77.58 },
  { day: 13, date: "Oct 13", rawWeight: 77.2, trendWeight: 77.51 },
  { day: 14, date: "Oct 14", rawWeight: 77.0, trendWeight: 77.44 },
  { day: 15, date: "Oct 15", rawWeight: 77.6, trendWeight: 77.38 },
  { day: 16, date: "Oct 16", rawWeight: 76.9, trendWeight: 77.31 },
  { day: 17, date: "Oct 17", rawWeight: 76.7, trendWeight: 77.23 },
  { day: 18, date: "Oct 18", rawWeight: 77.4, trendWeight: 77.17 },
  { day: 19, date: "Oct 19", rawWeight: 76.8, trendWeight: 77.1 },
  { day: 20, date: "Oct 20", rawWeight: 76.5, trendWeight: 77.02 },
  { day: 21, date: "Oct 21", rawWeight: 77.2, trendWeight: 76.96 },
  { day: 22, date: "Oct 22", rawWeight: 76.6, trendWeight: 76.89 },
  { day: 23, date: "Oct 23", rawWeight: 76.3, trendWeight: 76.81 },
  { day: 24, date: "Oct 24", rawWeight: 76.9, trendWeight: 76.75 },
  { day: 25, date: "Oct 25", rawWeight: 76.4, trendWeight: 76.68 },
  { day: 26, date: "Oct 26", rawWeight: 76.1, trendWeight: 76.6 },
  { day: 27, date: "Oct 27", rawWeight: 76.7, trendWeight: 76.53 },
  { day: 28, date: "Oct 28", rawWeight: 76.0, trendWeight: 76.45 },
  { day: 29, date: "Oct 29", rawWeight: 75.6, trendWeight: 76.36 },
  { day: 30, date: "Oct 30", rawWeight: 76.2, trendWeight: 75.8 },
];
