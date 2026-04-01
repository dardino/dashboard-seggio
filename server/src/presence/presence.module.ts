import { Module } from '@nestjs/common';
import { ConsultationsModule } from '../consultations/consultations.module';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';

@Module({
  imports: [ConsultationsModule],
  controllers: [PresenceController],
  providers: [PresenceService],
})
export class PresenceModule {}
