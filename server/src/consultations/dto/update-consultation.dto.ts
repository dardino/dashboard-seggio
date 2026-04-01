import {
  IsArray,
  IsHexColor,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationType } from '../consultation.types';

export class UpdateBallotCardDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsHexColor()
  color!: string;
}

export class UpdateVotingSessionDto {
  @IsISO8601()
  openAt!: string;

  @IsISO8601()
  closeAt!: string;
}

const CONSULTATION_TYPES: ConsultationType[] = ['politiche', 'amministrative', 'referendarie'];

export class UpdateConsultationDto {
  @IsOptional()
  @IsIn(CONSULTATION_TYPES)
  type?: ConsultationType;

  @IsOptional()
  @IsString()
  labelAL?: string;

  @IsOptional()
  @IsString()
  labelMZ?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateBallotCardDto)
  ballotCards?: UpdateBallotCardDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateVotingSessionDto)
  votingSessions?: UpdateVotingSessionDto[];
}
