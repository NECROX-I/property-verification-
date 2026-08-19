import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  ASSIGNMENT_QUEUE,
  SEARCH_QUEUE,
} from './jobs.constants';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(ASSIGNMENT_QUEUE)
    private readonly assignmentQueue: Queue,

    @InjectQueue(SEARCH_QUEUE)
    private readonly searchQueue: Queue,
  ) {}

  async addAssignmentJob(assignmentId: number) {
    return this.assignmentQueue.add(
      'calculate-statistics',
      {
        assignmentId,
      },
    );
  }

  async addSearchJob(propertyId: number) {
    return this.searchQueue.add(
      'verify-property',
      {
        propertyId,
      },
    );
  }
}