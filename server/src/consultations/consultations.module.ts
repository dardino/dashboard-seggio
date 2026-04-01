import { Module } from '@nestjs/common';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { DbRegistryService } from './db-registry.service';

@Module({
  controllers: [ConsultationsController],
  providers: [DbRegistryService, ConsultationsService],
  exports: [DbRegistryService],
})
export class ConsultationsModule {}
