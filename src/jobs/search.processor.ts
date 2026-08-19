import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { SEARCH_QUEUE } from './jobs.constants';
import { DATABASE } from '../database/database.constants';
import { properties } from '../database/schema';

@Processor(SEARCH_QUEUE)
export class SearchProcessor extends WorkerHost {
  constructor(
    @Inject(DATABASE)
    private readonly db: any,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'verify-property') {
      return;
    }

    const { propertyId } = job.data;

    console.log(
      `Starting property verification for ${propertyId}`,
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });

    const confidenceScore = Math.round(
      (0.7 + Math.random() * 0.3) * 100,
    );

    const status =
      confidenceScore >= 70
        ? 'VERIFIED'
        : 'PENDING_VERIFICATION';

    await this.db
      .update(properties)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId));

    console.log(
      `Property ${propertyId} verification completed. Confidence: ${confidenceScore}, Status: ${status}`,
    );

    return {
      propertyId,
      confidenceScore,
      status,
    };
  }
}