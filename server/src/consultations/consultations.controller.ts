import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  listConsultations(@Query('includeArchived') includeArchived?: string) {
    return this.consultationsService.listConsultations(includeArchived === 'true');
  }

  @Get(':id')
  getConsultation(@Param('id') id: string) {
    return this.consultationsService.getConsultation(id);
  }

  @Post()
  createConsultation(@Body() body: CreateConsultationDto) {
    return this.consultationsService.createConsultation(body);
  }

  @Put(':id')
  updateConsultation(@Param('id') id: string, @Body() body: UpdateConsultationDto) {
    return this.consultationsService.updateConsultation(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteConsultation(@Param('id') id: string) {
    return this.consultationsService.deleteConsultation(id);
  }

  @Post(':id/archive')
  archiveConsultation(@Param('id') id: string) {
    return this.consultationsService.archiveConsultation(id);
  }

  @Post(':id/restore')
  restoreConsultation(@Param('id') id: string) {
    return this.consultationsService.restoreConsultation(id);
  }
}
