import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import {
  assignmentProperties,
  properties,
  assignments,
  propertyReviews,
  auditLogs,
} from '../database/schema';
import { JobsService } from "../jobs/jobs.service";
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(@Inject(DATABASE) private readonly db: any,
    private readonly jobsService: JobsService
  ) { }

  async findAll(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (safePage - 1) * safeLimit;

    const data = await this.db
      .select()
      .from(properties)
      .limit(safeLimit)
      .offset(offset)
      .orderBy(properties.id);

    const countResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(properties);

    const total = Number(countResult[0].count);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!result[0]) {
      throw new NotFoundException('Property not found');
    }

    return result[0];
  }

  async proposeUpdate(
    propertyId: number,
    assignmentId: number,
    checkerId: number,
    dto: UpdatePropertyDto,
  ) {
    const property = await this.findById(propertyId);

    const assignment = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment[0]) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment[0].checkerId !== checkerId) {
      throw new BadRequestException(
        'You are not assigned to this assignment',
      );
    }

    if (
      assignment[0].status !== 'CLAIMED' &&
      assignment[0].status !== 'IN_PROGRESS'
    ) {
      throw new BadRequestException(
        'Assignment cannot be modified in its current state',
      );
    }

    const assignmentProperty = await this.db
      .select()
      .from(assignmentProperties)
      .where(
        and(
          eq(assignmentProperties.assignmentId, assignmentId),
          eq(assignmentProperties.propertyId, propertyId),
        ),
      )
      .limit(1);

    if (!assignmentProperty[0]) {
      throw new BadRequestException(
        'Property is not part of this assignment',
      );
    }

    const { notes, ...updatedValues } = dto;

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updatedValues)) {
      if (value !== undefined) {
        oldValues[key] = property[key];
        newValues[key] = value;
      }
    }

    if (Object.keys(newValues).length === 0) {
      throw new BadRequestException(
        'At least one property field must be updated',
      );
    }

    const review = await this.db.transaction(async (tx: any) => {
      const [createdReview] = await tx
        .insert(propertyReviews)
        .values({
          assignmentId,
          propertyId,
          checkerId,
          oldValues,
          newValues,
          notes: notes ?? null,
          status: 'PENDING',
        })
        .returning();

      if (assignment[0].status === 'CLAIMED') {
        await tx
          .update(assignments)
          .set({
            status: 'IN_PROGRESS',
            updatedAt: new Date(),
          })
          .where(eq(assignments.id, assignmentId));
      }

      return createdReview;
    });

    await this.jobsService.addSearchJob(propertyId);

    return review;
  }

  async getHistory(propertyId: number) {
    await this.findById(propertyId);

    return this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.propertyId, propertyId))
      .orderBy(sql`${auditLogs.createdAt} DESC`);
  }
}