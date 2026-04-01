export interface DashboardData {
  totalElectors: number;
  votersAL: number;
  votersMZ: number;
  comune: string;
  sezione: string;
  lastUpdatedAt: string | null;
}

export type ConsultationType = 'politiche' | 'amministrative' | 'referendarie';

export interface VotingSession {
  openAt: string;
  closeAt: string;
}

export interface BallotCard {
  id: string;
  label: string;
  color: string;
}

export interface Consultation {
  id: string;
  type: ConsultationType;
  labelAL: string;
  labelMZ: string;
  ballotCards: BallotCard[];
  votingSessions: VotingSession[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  fileDbName: string;
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
