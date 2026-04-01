import {
  IsArray,
  IsHexColor,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationType } from '../consultation.types';

export class BallotCardDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsHexColor()
  color!: string;
}

export class VotingSessionDto {
  @IsISO8601()
  openAt!: string;

  @IsISO8601()
  closeAt!: string;
}

const CONSULTATION_TYPES: ConsultationType[] = ['politiche', 'amministrative', 'referendarie'];

export class CreateConsultationDto {
  @IsIn(CONSULTATION_TYPES)
  type!: ConsultationType;

  @IsOptional()
  @IsString()
  labelAL?: string;

  @IsOptional()
  @IsString()
  labelMZ?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BallotCardDto)
  ballotCards!: BallotCardDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VotingSessionDto)
  votingSessions!: VotingSessionDto[];
}
