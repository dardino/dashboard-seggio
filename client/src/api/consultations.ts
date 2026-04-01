import type { BallotCard, Consultation, ConsultationType, VotingSession } from '../types';

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

export async function fetchConsultation(id: string): Promise<Consultation> {
  const response = await fetch(`${API_BASE_PATH}/consultations/${id}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation;
}

export interface ConsultationPayload {
  type: ConsultationType;
  labelAL?: string;
  labelMZ?: string;
  ballotCards: BallotCard[];
  votingSessions: VotingSession[];
}

export async function createConsultation(payload: ConsultationPayload): Promise<Consultation> {
  const response = await fetch(`${API_BASE_PATH}/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation;
}

export async function updateConsultation(
  id: string,
  payload: Partial<ConsultationPayload>,
): Promise<Consultation> {
  const response = await fetch(`${API_BASE_PATH}/consultations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation;
}

export async function deleteConsultation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_PATH}/consultations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export async function archiveConsultation(id: string): Promise<Consultation> {
  const response = await fetch(`${API_BASE_PATH}/consultations/${id}/archive`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation;
}

export async function restoreConsultation(id: string): Promise<Consultation> {
  const response = await fetch(`${API_BASE_PATH}/consultations/${id}/restore`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as Consultation;
}
