import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReviewsService } from './reviews.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'DATA_CHECKER' | 'REVIEWER';
  };
}

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('REVIEWER')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.approve(
      id,
      request.user.id,
    );
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.reject(
      id,
      request.user.id,
    );
  }

  @Post(':id/return')
  returnForCorrection(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviewsService.returnForCorrection(
      id,
      request.user.id,
    );
  }
}