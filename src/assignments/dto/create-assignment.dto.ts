import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Min,
} from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  propertyIds: number[];
}