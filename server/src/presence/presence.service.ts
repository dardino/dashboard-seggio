import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import type { Database } from 'sql.js';
import { DbRegistryService } from '../consultations/db-registry.service';
import {
  DEFAULT_PRESENCE_DATA,
  type PresenceData,
  type PresenceHistoryEntry,
  type PresenceHourlyDiffEntry,
  type PresenceRilevamentoInput,
  type PresenceSettingsInput,
} from './presence.types';

@Injectable()
export class PresenceService implements OnModuleInit {
  constructor(private readonly dbRegistry: DbRegistryService) {}

  async onModuleInit(): Promise<void> {
    // Database initialisation is handled by DbRegistryService.
  }

  async getPresence(consultationId: string): Promise<PresenceData> {
    const db = this.requireDatabase(consultationId);

    const result = db.exec(
      'SELECT consultationId, totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt FROM presence WHERE id = 1',
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return { consultationId, ...DEFAULT_PRESENCE_DATA };
    }

    const [cid, totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt] = result[0].values[0] as [
      string,
      number,
      number,
      number,
      string,
      string,
      string | null,
    ];

    return { consultationId: cid, totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt };
  }

  async updatePresence(consultationId: string, data: PresenceRilevamentoInput): Promise<PresenceData> {
    const db = this.requireDatabase(consultationId);
    const current = await this.getPresence(consultationId);
    const recordedAt = new Date().toISOString();

    db.run(
      `
        INSERT INTO presence (id, consultationId, totalElectors, votersAL, votersMZ, comune, sezione, lastUpdatedAt)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          votersAL = excluded.votersAL,
          votersMZ = excluded.votersMZ,
          lastUpdatedAt = excluded.lastUpdatedAt
      `,
      [consultationId, current.totalElectors, data.votersAL, data.votersMZ, current.comune, current.sezione, recordedAt],
    );

    db.run(
      `
        INSERT INTO presence_history (consultationId, recordedAt, totalElectors, votersAL, votersMZ, comune, sezione)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [consultationId, recordedAt, current.totalElectors, data.votersAL, data.votersMZ, current.comune, current.sezione],
    );

    await this.dbRegistry.persistConsultationDatabase(consultationId);

    return { ...current, votersAL: data.votersAL, votersMZ: data.votersMZ, lastUpdatedAt: recordedAt };
  }

  async updateSettings(consultationId: string, data: PresenceSettingsInput): Promise<PresenceData> {
    const db = this.requireDatabase(consultationId);

    db.run(
      `
        INSERT INTO presence (id, consultationId, totalElectors, votersAL, votersMZ, comune, sezione)
        VALUES (1, ?, ?, 0, 0, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          totalElectors = excluded.totalElectors,
          comune = excluded.comune,
          sezione = excluded.sezione
      `,
      [consultationId, data.totalElectors, data.comune, data.sezione],
    );

    await this.dbRegistry.persistConsultationDatabase(consultationId);

    return this.getPresence(consultationId);
  }

  async getPresenceHistory(consultationId: string): Promise<PresenceHistoryEntry[]> {
    const db = this.requireDatabase(consultationId);

    const result = db.exec(
      `
        SELECT consultationId, recordedAt, totalElectors, votersAL, votersMZ, comune, sezione
        FROM presence_history
        WHERE consultationId = ?
        ORDER BY recordedAt ASC
      `,
      [consultationId],
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map((row) => {
      const [cid, recordedAt, totalElectors, votersAL, votersMZ, comune, sezione] = row as [
        string,
        string,
        number,
        number,
        number,
        string,
        string,
      ];

      return { consultationId: cid, recordedAt, totalElectors, votersAL, votersMZ, comune, sezione };
    });
  }

  async getPresenceHourlyDiff(consultationId: string): Promise<PresenceHourlyDiffEntry[]> {
    const history = await this.getPresenceHistory(consultationId);

    if (history.length === 0) {
      return [];
    }

    const byHour = new Map<number, number>();

    for (const entry of history) {
      const date = new Date(entry.recordedAt);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      if (this.isPollingClosedHour(date)) {
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
      if (this.isPollingClosedHour(new Date(hour))) {
        continue;
      }

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

  private requireDatabase(consultationId: string): Database {
    const db = this.dbRegistry.getDatabase(consultationId);
    if (!db) {
      throw new NotFoundException(`Consultation ${consultationId} not found`);
    }
    return db;
  }

  private formatHourKey(timestampMs: number): string {
    const date = new Date(timestampMs);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hour = String(date.getHours()).padStart(2, '0');

    return `${day}${month}${year}-${hour}`;
  }

  private isPollingClosedHour(date: Date): boolean {
    const hour = date.getHours();

    return hour >= 0 && hour < 7;
  }
}
