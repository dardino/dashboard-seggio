import type { Consultation } from '../types';

const API_BASE_PATH = '/api';

export async function fetchConsultations(includeArchived = false): Promise<Consultation[]> {
  const url = includeArchived
    ? `${API_BASE_PATH}/consultations?includeArchived=true`
    : `${API_BASE_PATH}/consultations`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation[];
}
