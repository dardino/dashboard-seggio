export interface DashboardData {
  totalElectors: number;
  votersAL: number;
  votersMZ: number;
  comune: string;
  sezione: string;
  lastUpdatedAt: string | null;
}

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  totalElectors: 1000,
  votersAL: 0,
  votersMZ: 0,
  comune: 'San Giuliano Milanese',
  sezione: 'Seggio 6',
  lastUpdatedAt: null,
};

export interface DashboardMetrics {
  total: number;
  percentage: number;
}

export interface HourlyDiffDataPoint {
  hourKey: string;
  recordedTotal: number;
  diffFromPreviousHour: number;
}
