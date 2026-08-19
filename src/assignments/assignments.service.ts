import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import {
  assignmentProperties,
  assignments,
  properties,
} from '../database/schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import {JobsService} from "../jobs/jobs.service";

@Injectable()
export class AssignmentsService {
  constructor(@Inject(DATABASE) private readonly db: any,
    private readonly jobsService: JobsService
  ) { }

  async create(
    dto: CreateAssignmentDto,
    adminId: number,
  ) {
    const uniquePropertyIds = [...new Set(dto.propertyIds)];

    const existingProperties = await this.db
      .select({ id: properties.id })
      .from(properties)
      .where(
        sql`${properties.id} IN ${uniquePropertyIds}`,
      );

    if (existingProperties.length !== uniquePropertyIds.length) {
      throw new BadRequestException(
        'One or more properties do not exist',
      );
    }

    return this.db.transaction(async (tx: any) => {
      const [assignment] = await tx
        .insert(assignments)
        .values({
          title: dto.title,
          createdBy: adminId,
          totalProperties: uniquePropertyIds.length,
          status: 'OPEN',
        })
        .returning();

      await tx.insert(assignmentProperties).values(
        uniquePropertyIds.map((propertyId) => ({
          assignmentId: assignment.id,
          propertyId,
        })),
      );

      await this.jobsService.addAssignmentJob(assignment.id);
      return assignment;
    });
  }

  async findAll(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (safePage - 1) * safeLimit;

    const data = await this.db
      .select()
      .from(assignments)
      .limit(safeLimit)
      .offset(offset)
      .orderBy(assignments.id);

    const countResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(assignments);

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
    const assignment = await this.db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);

    if (!assignment[0]) {
      throw new NotFoundException('Assignment not found');
    }

    const assignedProperties = await this.db
      .select({
        id: properties.id,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        zip: properties.zip,
      })
      .from(assignmentProperties)
      .innerJoin(
        properties,
        eq(assignmentProperties.propertyId, properties.id),
      )
      .where(eq(assignmentProperties.assignmentId, id));

    return {
      ...assignment[0],
      properties: assignedProperties,
    };
  }

  async claim(id: number, checkerId: number) {
    return this.db.transaction(async (tx: any) => {
      const result = await tx
        .update(assignments)
        .set({
          checkerId,
          status: 'CLAIMED',
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assignments.id, id),
            eq(assignments.status, 'OPEN'),
            sql`${assignments.checkerId} IS NULL`,
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new ConflictException(
          'Assignment is already claimed or unavailable',
        );
      }

      return result[0];
    });
  }

  async submit(id: number, checkerId: number) {
    const result = await this.db
      .update(assignments)
      .set({
        status: 'SUBMITTED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assignments.id, id),
          eq(assignments.checkerId, checkerId),
          eq(assignments.status, 'IN_PROGRESS'),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new BadRequestException(
        'Assignment must be in progress before submission',
      );
    }

    return result[0];
  }
}