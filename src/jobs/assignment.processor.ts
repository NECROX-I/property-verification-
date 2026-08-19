import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { ASSIGNMENT_QUEUE } from './jobs.constants';
import { DATABASE } from '../database/database.constants';
import {
  assignments,
  assignmentProperties,
} from '../database/schema';

@Processor(ASSIGNMENT_QUEUE)
export class AssignmentProcessor extends WorkerHost {
  constructor(
    @Inject(DATABASE)
    private readonly db: any,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'calculate-statistics') {
      return;
    }

    const { assignmentId } = job.data;

    const result = await this.db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(assignmentProperties)
      .where(
        eq(
          assignmentProperties.assignmentId,
          assignmentId,
        ),
      );

    const totalProperties = Number(result[0].total);

    const estimatedCompletionMinutes =
      totalProperties * 5;

    const [assignment] = await this.db
      .update(assignments)
      .set({
        totalProperties,
        estimatedCompletionMinutes,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    console.log(
      `Assignment ${assignmentId}: ${totalProperties} properties, estimated completion ${estimatedCompletionMinutes} minutes`,
    );

    return {
      assignmentId,
      totalProperties,
      estimatedCompletionMinutes,
    };
  }
}