export interface PresenceData {
  totalElectors: number;
  votersAL: number;
  votersMZ: number;
  comune: string;
  sezione: string;
  lastUpdatedAt: string | null;
}

export interface PresenceHistoryEntry {
  recordedAt: string;
  totalElectors: number;
  votersAL: number;
  votersMZ: number;
  comune: string;
  sezione: string;
}

export interface PresenceHourlyDiffEntry {
  hourKey: string;
  recordedTotal: number;
  diffFromPreviousHour: number;
}

export type PresenceUpdateInput = Omit<PresenceData, 'lastUpdatedAt'>;
export type PresenceRilevamentoInput = Pick<PresenceData, 'votersAL' | 'votersMZ'>;
export type PresenceSettingsInput = Pick<PresenceData, 'comune' | 'sezione' | 'totalElectors'>;

export const DEFAULT_PRESENCE_DATA: PresenceData = {
  totalElectors: 1000,
  votersAL: 0,
  votersMZ: 0,
  comune: 'San Giuliano Milanese',
  sezione: 'Seggio 6',
  lastUpdatedAt: null,
};
