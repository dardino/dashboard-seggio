import type { DashboardData, HourlyDiffDataPoint } from '../types';

const API_BASE_PATH = '/api';

function normalizeDashboardData(value: unknown): DashboardData {
  const input = value as Partial<DashboardData>;

  return {
    totalElectors: Number(input.totalElectors) || 0,
    votersAL: Number(input.votersAL) || 0,
    votersMZ: Number(input.votersMZ) || 0,
    comune: typeof input.comune === 'string' ? input.comune : '',
    sezione: typeof input.sezione === 'string' ? input.sezione : '',
    lastUpdatedAt: typeof input.lastUpdatedAt === 'string' ? input.lastUpdatedAt : null,
  };
}

async function parseResponse(response: Response): Promise<DashboardData> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return normalizeDashboardData(payload);
}

function normalizeHourlyDiffData(value: unknown): HourlyDiffDataPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const input = entry as Partial<HourlyDiffDataPoint>;

    return {
      hourKey: typeof input.hourKey === 'string' ? input.hourKey : '',
      recordedTotal: Number(input.recordedTotal) || 0,
      diffFromPreviousHour: Number(input.diffFromPreviousHour) || 0,
    };
  });
}

export async function fetchPresence(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_PATH}/presence`);
  return parseResponse(response);
}

export async function putPresence(data: DashboardData): Promise<DashboardData> {
  const payload = {
    totalElectors: data.totalElectors,
    votersAL: data.votersAL,
    votersMZ: data.votersMZ,
    comune: data.comune,
    sezione: data.sezione,
  };

  const response = await fetch(`${API_BASE_PATH}/presence`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function fetchPresenceHourlyDiff(): Promise<HourlyDiffDataPoint[]> {
  const response = await fetch(`${API_BASE_PATH}/presence/history/hourly-diff`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return normalizeHourlyDiffData(payload);
}
