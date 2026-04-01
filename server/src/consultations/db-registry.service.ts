import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { basename, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import {
  type BallotCard,
  type Consultation,
  type ConsultationType,
  DEFAULT_LABEL_AL,
  DEFAULT_LABEL_MZ,
  type VotingSession,
} from './consultation.types';

export interface ConsultationCreateInput {
  type: ConsultationType;
  labelAL?: string;
  labelMZ?: string;
  ballotCards: BallotCard[];
  votingSessions: VotingSession[];
}

export interface ConsultationUpdateInput {
  type?: ConsultationType;
  labelAL?: string;
  labelMZ?: string;
  ballotCards?: BallotCard[];
  votingSessions?: VotingSession[];
}

interface ConsultationDbEntry {
  consultation: Consultation;
  database: Database;
  filePath: string;
}

@Injectable()
export class DbRegistryService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DbRegistryService.name);
  private sql!: SqlJsStatic;
  private readonly dataDir = resolve(__dirname, '..', '..', 'data');
  private readonly entries = new Map<string, ConsultationDbEntry>();

  async onModuleInit(): Promise<void> {
    this.sql = await initSqlJs({
      locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    });

    await fs.mkdir(this.dataDir, { recursive: true });
    await this.scanAndLoad();
  }

  async onApplicationShutdown(): Promise<void> {
    for (const entry of this.entries.values()) {
      entry.database.close();
    }
    this.entries.clear();
  }

  // ---------------------------------------------------------------------------
  // Public query methods
  // ---------------------------------------------------------------------------

  listConsultations(includeArchived = false): Consultation[] {
    return [...this.entries.values()]
      .map((e) => e.consultation)
      .filter((c) => includeArchived || !c.archived)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  getConsultation(id: string): Consultation | undefined {
    return this.entries.get(id)?.consultation;
  }

  getDatabase(consultationId: string): Database | undefined {
    return this.entries.get(consultationId)?.database;
  }

  // ---------------------------------------------------------------------------
  // CRUD lifecycle methods
  // ---------------------------------------------------------------------------

  async createConsultation(input: ConsultationCreateInput): Promise<Consultation> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const firstDate = this.getFirstDate(input.votingSessions);
    const progressivo = this.nextProgressivo(firstDate);
    const fileName = `consultazione_${firstDate}_${progressivo}.sqlite`;
    const filePath = resolve(this.dataDir, fileName);

    const database = new this.sql.Database();
    this.initSchema(database);

    const consultation: Consultation = {
      id,
      type: input.type,
      labelAL: input.labelAL ?? DEFAULT_LABEL_AL,
      labelMZ: input.labelMZ ?? DEFAULT_LABEL_MZ,
      ballotCards: input.ballotCards,
      votingSessions: input.votingSessions,
      archived: false,
      createdAt: now,
      updatedAt: now,
      fileDbName: fileName,
    };

    this.writeConsultationRow(database, consultation);
    await this.persistDatabase(database, filePath);

    this.entries.set(id, { consultation, database, filePath });
    return consultation;
  }

  async updateConsultation(id: string, input: ConsultationUpdateInput): Promise<Consultation | undefined> {
    const entry = this.entries.get(id);
    if (!entry) return undefined;

    const now = new Date().toISOString();
    const updated: Consultation = {
      ...entry.consultation,
      type: input.type ?? entry.consultation.type,
      labelAL: input.labelAL ?? entry.consultation.labelAL,
      labelMZ: input.labelMZ ?? entry.consultation.labelMZ,
      ballotCards: input.ballotCards ?? entry.consultation.ballotCards,
      votingSessions: input.votingSessions ?? entry.consultation.votingSessions,
      updatedAt: now,
    };

    // Check if firstDate changed due to updated votingSessions
    if (input.votingSessions) {
      const newFirstDate = this.getFirstDate(updated.votingSessions);
      const oldFirstDate = this.getFirstDateFromFileName(entry.filePath);

      if (newFirstDate !== oldFirstDate) {
        const progressivo = this.nextProgressivo(newFirstDate);
        const newFileName = `consultazione_${newFirstDate}_${progressivo}.sqlite`;
        const newFilePath = resolve(this.dataDir, newFileName);

        await fs.rename(entry.filePath, newFilePath);
        updated.fileDbName = newFileName;
        entry.filePath = newFilePath;
      }
    }

    this.writeConsultationRow(entry.database, updated);
    await this.persistDatabase(entry.database, entry.filePath);

    entry.consultation = updated;
    return updated;
  }

  async archiveConsultation(id: string): Promise<Consultation | undefined> {
    const entry = this.entries.get(id);
    if (!entry || entry.consultation.archived) return entry?.consultation;

    const newFilePath = entry.filePath + '.bak';
    await this.persistDatabase(entry.database, entry.filePath);
    entry.database.close();
    await fs.rename(entry.filePath, newFilePath);

    entry.filePath = newFilePath;
    entry.consultation = {
      ...entry.consultation,
      archived: true,
      updatedAt: new Date().toISOString(),
      fileDbName: basename(newFilePath),
    };

    const fileBuffer = await fs.readFile(newFilePath);
    entry.database = new this.sql.Database(fileBuffer);
    this.writeConsultationRow(entry.database, entry.consultation);
    await this.persistDatabase(entry.database, newFilePath);

    return entry.consultation;
  }

  async restoreConsultation(id: string): Promise<Consultation | undefined> {
    const entry = this.entries.get(id);
    if (!entry || !entry.consultation.archived) return entry?.consultation;

    const newFilePath = entry.filePath.replace(/\.bak$/, '');
    await this.persistDatabase(entry.database, entry.filePath);
    entry.database.close();
    await fs.rename(entry.filePath, newFilePath);

    entry.filePath = newFilePath;
    entry.consultation = {
      ...entry.consultation,
      archived: false,
      updatedAt: new Date().toISOString(),
      fileDbName: basename(newFilePath),
    };

    const fileBuffer = await fs.readFile(newFilePath);
    entry.database = new this.sql.Database(fileBuffer);
    this.writeConsultationRow(entry.database, entry.consultation);
    await this.persistDatabase(entry.database, newFilePath);

    return entry.consultation;
  }

  async deleteConsultation(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    entry.database.close();
    await fs.unlink(entry.filePath);
    this.entries.delete(id);
    return true;
  }

  async persistConsultationDatabase(consultationId: string): Promise<void> {
    const entry = this.entries.get(consultationId);
    if (entry) {
      await this.persistDatabase(entry.database, entry.filePath);
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async scanAndLoad(): Promise<void> {
    let files: string[];
    try {
      files = await fs.readdir(this.dataDir);
    } catch {
      return;
    }

    const sqliteFiles = files.filter(
      (f) => /^consultazione_\d{4}-\d{2}-\d{2}_\d+\.sqlite(\.bak)?$/.test(f),
    );

    for (const fileName of sqliteFiles) {
      try {
        const filePath = resolve(this.dataDir, fileName);
        const fileBuffer = await fs.readFile(filePath);
        const database = new this.sql.Database(fileBuffer);
        const consultation = this.readConsultationRow(database, fileName);

        if (consultation) {
          this.entries.set(consultation.id, { consultation, database, filePath });
          this.logger.log(`Loaded consultation ${consultation.id} from ${fileName}`);
        } else {
          database.close();
          this.logger.warn(`No consultation metadata found in ${fileName}, skipping`);
        }
      } catch (err) {
        this.logger.error(`Failed to load ${fileName}: ${String(err)}`);
      }
    }
  }

  private initSchema(database: Database): void {
    database.exec(`
      CREATE TABLE IF NOT EXISTS consultation (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        labelAL TEXT NOT NULL,
        labelMZ TEXT NOT NULL,
        ballotCards TEXT NOT NULL,
        votingSessions TEXT NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        fileDbName TEXT NOT NULL
      )
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS presence (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        consultationId TEXT NOT NULL,
        totalElectors INTEGER NOT NULL,
        votersAL INTEGER NOT NULL,
        votersMZ INTEGER NOT NULL,
        comune TEXT NOT NULL,
        sezione TEXT NOT NULL,
        lastUpdatedAt TEXT
      )
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS presence_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultationId TEXT NOT NULL,
        recordedAt TEXT NOT NULL,
        totalElectors INTEGER NOT NULL,
        votersAL INTEGER NOT NULL,
        votersMZ INTEGER NOT NULL,
        comune TEXT NOT NULL,
        sezione TEXT NOT NULL
      )
    `);
  }

  private writeConsultationRow(database: Database, consultation: Consultation): void {
    database.run(
      `
        INSERT INTO consultation (id, type, labelAL, labelMZ, ballotCards, votingSessions, archived, createdAt, updatedAt, fileDbName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          labelAL = excluded.labelAL,
          labelMZ = excluded.labelMZ,
          ballotCards = excluded.ballotCards,
          votingSessions = excluded.votingSessions,
          archived = excluded.archived,
          updatedAt = excluded.updatedAt,
          fileDbName = excluded.fileDbName
      `,
      [
        consultation.id,
        consultation.type,
        consultation.labelAL,
        consultation.labelMZ,
        JSON.stringify(consultation.ballotCards),
        JSON.stringify(consultation.votingSessions),
        consultation.archived ? 1 : 0,
        consultation.createdAt,
        consultation.updatedAt,
        consultation.fileDbName,
      ],
    );
  }

  private readConsultationRow(database: Database, fileName: string): Consultation | null {
    try {
      const result = database.exec(
        'SELECT id, type, labelAL, labelMZ, ballotCards, votingSessions, archived, createdAt, updatedAt, fileDbName FROM consultation LIMIT 1',
      );

      if (result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const [id, type, labelAL, labelMZ, ballotCardsJson, votingSessionsJson, archived, createdAt, updatedAt, fileDbName] =
        result[0].values[0] as [string, string, string, string, string, string, number, string, string, string];

      return {
        id,
        type: type as ConsultationType,
        labelAL,
        labelMZ,
        ballotCards: JSON.parse(ballotCardsJson) as BallotCard[],
        votingSessions: JSON.parse(votingSessionsJson) as VotingSession[],
        archived: archived === 1,
        createdAt,
        updatedAt,
        fileDbName: fileDbName ?? fileName,
      };
    } catch {
      return null;
    }
  }

  private async persistDatabase(database: Database, filePath: string): Promise<void> {
    const bytes = database.export();
    await fs.writeFile(filePath, Buffer.from(bytes));
  }

  private getFirstDate(votingSessions: VotingSession[]): string {
    const sorted = [...votingSessions].sort((a, b) => a.openAt.localeCompare(b.openAt));
    const firstDate = new Date(sorted[0].openAt);
    const yyyy = firstDate.getUTCFullYear();
    const mm = String(firstDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(firstDate.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private getFirstDateFromFileName(filePath: string): string {
    const match = basename(filePath).match(/^consultazione_(\d{4}-\d{2}-\d{2})_\d+/);
    return match ? match[1] : '';
  }

  private nextProgressivo(firstDate: string): number {
    let max = 0;
    for (const entry of this.entries.values()) {
      const entryDate = this.getFirstDateFromFileName(entry.filePath);
      if (entryDate === firstDate) {
        const match = basename(entry.filePath).match(/_(\d+)\.sqlite/);
        if (match) {
          max = Math.max(max, parseInt(match[1], 10));
        }
      }
    }
    return max + 1;
  }
}
