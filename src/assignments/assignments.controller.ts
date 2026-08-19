import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentsService } from './assignments.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'DATA_CHECKER' | 'REVIEWER';
  };
}

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body() dto: CreateAssignmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.assignmentsService.create(
      dto,
      request.user.id,
    );
  }

  @Get()
  @Roles('ADMIN', 'DATA_CHECKER', 'REVIEWER')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assignmentsService.findAll(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'DATA_CHECKER', 'REVIEWER')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.findById(id);
  }

  @Post(':id/claim')
  @Roles('DATA_CHECKER')
  claim(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.assignmentsService.claim(
      id,
      request.user.id,
    );
  }

  @Post(':id/submit')
  @Roles('DATA_CHECKER')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.assignmentsService.submit(
      id,
      request.user.id,
    );
  }
}