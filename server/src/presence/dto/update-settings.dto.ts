import { IsInt, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt()
  @Min(0)
  totalElectors!: number;

  @IsString()
  comune!: string;

  @IsString()
  sezione!: string;
}
