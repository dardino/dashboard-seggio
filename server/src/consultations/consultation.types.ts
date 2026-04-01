export type ConsultationType = 'politiche' | 'amministrative' | 'referendarie';

export interface VotingSession {
  openAt: string;  // ISO datetime
  closeAt: string; // ISO datetime
}

export interface BallotCard {
  id: string;
  label: string;  // e.g. "Scheda Rosa"
  color: string;  // hex color e.g. "#e91e63"
}

export interface Consultation {
  id: string;                        // uuid
  titolo: string;                    // human-readable title
  type: ConsultationType;
  labelAL: string;                   // default "A-L"
  labelMZ: string;                   // default "M-Z"
  ballotCards: BallotCard[];         // at least one
  votingSessions: VotingSession[];   // at least one, ordered by date
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  fileDbName: string;                // for debug/admin
}

export const DEFAULT_LABEL_AL = 'A-L';
export const DEFAULT_LABEL_MZ = 'M-Z';
export const DEFAULT_TITOLO = '';
