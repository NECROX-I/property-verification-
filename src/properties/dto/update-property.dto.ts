import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  yearBuilt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  livingArea?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lotSize?: number;

  @IsOptional()
  @IsString()
  heating?: string;

  @IsOptional()
  @IsString()
  cooling?: string;

  @IsOptional()
  @IsString()
  water?: string;

  @IsOptional()
  @IsString()
  sewer?: string;

  @IsOptional()
  @IsArray()
  appliances?: string[];

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsString()
  listingAgent?: string;

  @IsOptional()
  @IsString()
  buyerAgent?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}