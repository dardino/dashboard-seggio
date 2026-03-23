import { Body, Controller, Get, Put } from '@nestjs/common';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PresenceService } from './presence.service';

@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Get()
  getPresence() {
    return this.presenceService.getPresence();
  }

  @Get('history')
  getPresenceHistory() {
    return this.presenceService.getPresenceHistory();
  }

  @Get('history/hourly-diff')
  getPresenceHourlyDiff() {
    return this.presenceService.getPresenceHourlyDiff();
  }

  @Put()
  updatePresence(@Body() body: UpdatePresenceDto) {
    return this.presenceService.updatePresence(body);
  }

  @Put('settings')
  updateSettings(@Body() body: UpdateSettingsDto) {
    return this.presenceService.updateSettings(body);
  }
}
