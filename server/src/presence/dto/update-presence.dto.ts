import { IsInt, Min } from 'class-validator';

export class UpdatePresenceDto {
  @IsInt()
  @Min(0)
  votersAL!: number;

  @IsInt()
  @Min(0)
  votersMZ!: number;
}
