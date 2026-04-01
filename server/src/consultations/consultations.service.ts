import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { type Consultation } from './consultation.types';
import { DbRegistryService } from './db-registry.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(private readonly dbRegistry: DbRegistryService) {}

  listConsultations(includeArchived = false): Consultation[] {
    return this.dbRegistry.listConsultations(includeArchived);
  }

  getConsultation(id: string): Consultation {
    const consultation = this.dbRegistry.getConsultation(id);
    if (!consultation) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return consultation;
  }

  async createConsultation(dto: CreateConsultationDto): Promise<Consultation> {
    this.validateVotingSessions(dto.votingSessions);
    return this.dbRegistry.createConsultation(dto);
  }

  async updateConsultation(id: string, dto: UpdateConsultationDto): Promise<Consultation> {
    const existing = this.dbRegistry.getConsultation(id);
    if (!existing) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    if (dto.votingSessions) {
      this.validateVotingSessions(dto.votingSessions);
    }
    const updated = await this.dbRegistry.updateConsultation(id, dto);
    if (!updated) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return updated;
  }

  async deleteConsultation(id: string): Promise<void> {
    const deleted = await this.dbRegistry.deleteConsultation(id);
    if (!deleted) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
  }

  async archiveConsultation(id: string): Promise<Consultation> {
    const existing = this.dbRegistry.getConsultation(id);
    if (!existing) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    const result = await this.dbRegistry.archiveConsultation(id);
    if (!result) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return result;
  }

  async restoreConsultation(id: string): Promise<Consultation> {
    const existing = this.dbRegistry.getConsultation(id);
    if (!existing) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    const result = await this.dbRegistry.restoreConsultation(id);
    if (!result) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
    return result;
  }

  private validateVotingSessions(sessions: Array<{ openAt: string; closeAt: string }>): void {
    for (const session of sessions) {
      if (new Date(session.openAt) >= new Date(session.closeAt)) {
        throw new UnprocessableEntityException(
          `VotingSession openAt must be before closeAt: ${session.openAt} >= ${session.closeAt}`,
        );
      }
    }
  }
}
