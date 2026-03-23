import { IsInt, IsString, Min } from 'class-validator';

export class UpdatePresenceDto {
  @IsInt()
  @Min(0)
  totalElectors!: number;

  @IsInt()
  @Min(0)
  votersAL!: number;

  @IsInt()
  @Min(0)
  votersMZ!: number;

  @IsString()
  comune!: string;

  @IsString()
  sezione!: string;
}
