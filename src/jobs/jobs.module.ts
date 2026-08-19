import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {DatabaseModule} from "../database/database.module";
import {
  ASSIGNMENT_QUEUE,
  SEARCH_QUEUE,
} from './jobs.constants';
import { JobsService } from './jobs.service';
import { AssignmentProcessor } from './assignment.processor';
import { SearchProcessor } from './search.processor';

@Module({
  imports: [
    DatabaseModule,
    
    BullModule.registerQueue(
      {
        name: ASSIGNMENT_QUEUE,
      },
      {
        name: SEARCH_QUEUE,
      },
    ),
  ],
  providers: [
    JobsService,
    AssignmentProcessor,
    SearchProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}