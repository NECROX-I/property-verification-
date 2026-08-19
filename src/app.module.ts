import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ReviewsModule } from './reviews/reviews.module';
import {BullModule} from "@nestjs/bullmq";
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '  6379', 10),
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    AssignmentsModule,
    ReviewsModule,
    JobsModule,
  ],
})
export class AppModule {}