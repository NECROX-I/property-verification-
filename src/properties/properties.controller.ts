import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PropertiesService } from './properties.service';
import { UpdatePropertyDto } from './dto/update-property.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'DATA_CHECKER' | 'REVIEWER';
  };
}

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
  ) { }

  @Get()
  @Roles('ADMIN', 'DATA_CHECKER', 'REVIEWER')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.findAll(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'DATA_CHECKER', 'REVIEWER')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findById(id);
  }

  @Get(':id/history')
  @Roles('ADMIN', 'DATA_CHECKER', 'REVIEWER')
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.getHistory(id);
  }

  @Put(':id')
  @Roles('DATA_CHECKER')
  proposeUpdate(
    @Param('id', ParseIntPipe) propertyId: number,
    @Query('assignmentId', ParseIntPipe) assignmentId: number,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.proposeUpdate(
      propertyId,
      assignmentId,
      request.user.id,
      dto,
    );
  }
}