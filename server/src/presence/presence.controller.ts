import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PresenceService } from './presence.service';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get(':consultationId')
  getPresence(@Param('consultationId') consultationId: string) {
    return this.presenceService.getPresence(consultationId);
  }

  @Get(':consultationId/history')
  getPresenceHistory(@Param('consultationId') consultationId: string) {
    return this.presenceService.getPresenceHistory(consultationId);
  }

  @Get(':consultationId/history/hourly-diff')
  getPresenceHourlyDiff(@Param('consultationId') consultationId: string) {
    return this.presenceService.getPresenceHourlyDiff(consultationId);
  }

  @Put(':consultationId')
  updatePresence(@Param('consultationId') consultationId: string, @Body() body: UpdatePresenceDto) {
    return this.presenceService.updatePresence(consultationId, body);
  }

  @Put(':consultationId/settings')
  updateSettings(@Param('consultationId') consultationId: string, @Body() body: UpdateSettingsDto) {
    return this.presenceService.updateSettings(consultationId, body);
  }
}
