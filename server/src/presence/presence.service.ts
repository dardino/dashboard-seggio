import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import {
  DEFAULT_PRESENCE_DATA,
  type PresenceData,
  type PresenceHistoryEntry,
  type PresenceHourlyDiffEntry,
  type PresenceUpdateInput,
} from './presence.types';

@Injectable()
export class PresenceService implements OnModuleInit, OnApplicationShutdown {
  private database!: Database;
  private sql!: SqlJsStatic;
  private readonly databasePath = resolve(__dirname, '..', '..', 'data', 'referendum.sqlite');

  async onModuleInit() {
    this.sql = await initSqlJs({
      locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    });

    await fs.mkdir(dirname(this.databasePath), { recursive: true });

    try {
      const fileBuffer = await fs.readFile(this.databasePath);
      this.database = new this.sql.Database(fileBuffer);
    } catch (error) {
      const fileNotFound =
        error instanceof Error && 'code' in error && error.code === 'ENOENT';

      if (!fileNotFound) {
        throw error;
      }

      this.database = new this.sql.Database();
    }

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS presence (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        totalElectors INTEGER NOT NULL,
        votersAL INTEGER NOT NULL,
        votersMZ INTEGER NOT NULL,
        comune TEXT NOT NULL,
        sezione TEXT NOT NULL,
        lastUpdatedAt TEXT
      )
    `);

    this.database.exec(`
      CREATE TABLE IF NOT EXISTS presence_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recordedAt TEXT NOT NULL,
        totalElectors INTEGER NOT NULL,
        votersAL INTEGER NOT NULL,
        votersMZ INTEGER NOT NULL,
        comune TEXT NOT NULL,
        sezione TEXT NOT NULL
      )
    `);

    this.ensureColumn('comune', "TEXT NOT NULL DEFAULT 'San Giuliano Milanese'");
    this.ensureColumn('sezione', "TEXT NOT NULL DEFAULT 'Seggio 6'");
    this.ensureColumn('lastUpdatedAt', 'TEXT');

    await this.persist();
  }

  async onApplicationShutdown() {
    if (this.database) {
      this.database.close();
    }
  }

  async getPresence(): Promise<PresenceData> {
    const result = this.database.exec(
      'SELECT totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt FROM presence WHERE id = 1',
    );

    if (result.length === 0) {
      return DEFAULT_PRESENCE_DATA;
    }

    const [totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt] = result[0].values[0] as [
      number,
      number,
      number,
      string,
      string,
      string | null,
    ];

    return {
      totalElectors,
      votersAL,
      votersMZ,
      comune,
      sezione,
      lastUpdatedAt,
    };
  }

  async updatePresence(data: PresenceUpdateInput): Promise<PresenceData> {
    const recordedAt = new Date().toISOString();

    this.database.run(
      `
        INSERT INTO presence (id, totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          totalElectors = excluded.totalElectors,
          votersAL = excluded.votersAL,
          votersMZ = excluded.votersMZ,
          comune = excluded.comune,
          sezione = excluded.sezione,
          lastUpdatedAt = excluded.lastUpdatedAt
      `,
      [
        data.totalElectors,
        data.votersAL,
        data.votersMZ,
        data.comune,
        data.sezione,
        recordedAt,
      ],
    );

    this.database.run(
      `
        INSERT INTO presence_history (recordedAt, totalElectors, votersAL, votersMZ, comune, sezione)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        recordedAt,
        data.totalElectors,
        data.votersAL,
        data.votersMZ,
        data.comune,
        data.sezione,
      ],
    );

    await this.persist();

    return {
      ...data,
      lastUpdatedAt: recordedAt,
    };
  }

  async getPresenceHistory(): Promise<PresenceHistoryEntry[]> {
    const result = this.database.exec(
      `
        SELECT recordedAt, totalElectors, votersAL, votersMZ, comune, sezione
        FROM presence_history
        ORDER BY recordedAt ASC
      `,
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map((row) => {
      const [recordedAt, totalElectors, votersAL, votersMZ, comune, sezione] = row as [
        string,
        number,
        number,
        number,
        string,
        string,
      ];

      return {
        recordedAt,
        totalElectors,
        votersAL,
        votersMZ,
        comune,
        sezione,
      };
    });
  }

  async getPresenceHourlyDiff(): Promise<PresenceHourlyDiffEntry[]> {
    const history = await this.getPresenceHistory();

    if (history.length === 0) {
      return [];
    }

    const byHour = new Map<number, number>();

    for (const entry of history) {
      const date = new Date(entry.recordedAt);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const hourStart = new Date(date);
      hourStart.setMinutes(0, 0, 0);
      const hourTs = hourStart.getTime();
      const total = entry.votersAL + entry.votersMZ;

      // Keep the latest cumulative value seen for each hour bucket.
      byHour.set(hourTs, total);
    }

    const sortedHours = [...byHour.keys()].sort((a, b) => a - b);

    if (sortedHours.length === 0) {
      return [];
    }

    const firstHour = sortedHours[0];
    const lastHour = sortedHours[sortedHours.length - 1];
    const oneHourMs = 60 * 60 * 1000;

    const response: PresenceHourlyDiffEntry[] = [];
    let previousTotal = byHour.get(firstHour) ?? 0;

    response.push({
      hourKey: this.formatHourKey(firstHour),
      recordedTotal: previousTotal,
      diffFromPreviousHour: 0,
    });

    for (let hour = firstHour + oneHourMs; hour <= lastHour; hour += oneHourMs) {
      const hasReading = byHour.has(hour);
      const currentTotal = hasReading ? (byHour.get(hour) ?? previousTotal) : previousTotal;
      const diffFromPreviousHour = hasReading ? Math.max(0, currentTotal - previousTotal) : 0;

      response.push({
        hourKey: this.formatHourKey(hour),
        recordedTotal: currentTotal,
        diffFromPreviousHour,
      });

      previousTotal = currentTotal;
    }

    return response;
  }

  private async persist() {
    const databaseBytes = this.database.export();
    await fs.writeFile(this.databasePath, Buffer.from(databaseBytes));
  }

  private ensureColumn(columnName: string, columnDefinition: string) {
    const tableInfo = this.database.exec('PRAGMA table_info(presence)');

    if (tableInfo.length === 0) {
      return;
    }

    const existingColumns = new Set(
      tableInfo[0].values.map((row) => String(row[1])),
    );

    if (!existingColumns.has(columnName)) {
      this.database.exec(`ALTER TABLE presence ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  private formatHourKey(timestampMs: number): string {
    const date = new Date(timestampMs);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hour = String(date.getHours()).padStart(2, '0');

    return `${day}${month}${year}-${hour}`;
  }
}
