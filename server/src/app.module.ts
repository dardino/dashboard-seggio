import { Module } from '@nestjs/common';
import { ConsultationsModule } from './consultations/consultations.module';
import { PresenceModule } from './presence/presence.module';

@Module({
  imports: [ConsultationsModule, PresenceModule],
})
export class AppModule {}
