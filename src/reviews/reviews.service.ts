import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import {
  assignments,
  auditLogs,
  properties,
  propertyReviews,
} from '../database/schema';

@Injectable()
export class ReviewsService {
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll() {
    return this.db
      .select({
        id: propertyReviews.id,
        propertyId: propertyReviews.propertyId,
        assignmentId: propertyReviews.assignmentId,
        checkerId: propertyReviews.checkerId,
        oldValues: propertyReviews.oldValues,
        newValues: propertyReviews.newValues,
        notes: propertyReviews.notes,
        status: propertyReviews.status,
        createdAt: propertyReviews.createdAt,
      })
      .from(propertyReviews)
      .orderBy(sql`${propertyReviews.createdAt} DESC`);
  }

  async approve(reviewId: number, reviewerId: number) {
    return this.db.transaction(async (tx: any) => {
      const review = await tx
        .select()
        .from(propertyReviews)
        .where(eq(propertyReviews.id, reviewId))
        .limit(1);

      if (!review[0]) {
        throw new NotFoundException('Review not found');
      }

      if (review[0].status !== 'PENDING') {
        throw new BadRequestException(
          'Review has already been processed',
        );
      }

      const updatedProperty = await tx
        .update(properties)
        .set(review[0].newValues)
        .where(eq(properties.id, review[0].propertyId))
        .returning();

      await tx
        .update(propertyReviews)
        .set({
          status: 'APPROVED',
          reviewerId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(propertyReviews.id, reviewId),
            eq(propertyReviews.status, 'PENDING'),
          ),
        );

      await tx.insert(auditLogs).values({
        propertyId: review[0].propertyId,
        userId: reviewerId,
        changedFields: Object.keys(review[0].newValues),
        oldValues: review[0].oldValues,
        newValues: review[0].newValues,
      });

      return updatedProperty[0];
    });
  }

  async reject(reviewId: number, reviewerId: number) {
    return this.db.transaction(async (tx: any) => {
      const review = await tx
        .select()
        .from(propertyReviews)
        .where(eq(propertyReviews.id, reviewId))
        .limit(1);

      if (!review[0]) {
        throw new NotFoundException('Review not found');
      }

      if (review[0].status !== 'PENDING') {
        throw new BadRequestException(
          'Review has already been processed',
        );
      }

      const [updatedReview] = await tx
        .update(propertyReviews)
        .set({
          status: 'REJECTED',
          reviewerId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(propertyReviews.id, reviewId),
            eq(propertyReviews.status, 'PENDING'),
          ),
        )
        .returning();

      return updatedReview;
    });
  }

  async returnForCorrection(
    reviewId: number,
    reviewerId: number,
  ) {
    return this.db.transaction(async (tx: any) => {
      const review = await tx
        .select()
        .from(propertyReviews)
        .where(eq(propertyReviews.id, reviewId))
        .limit(1);

      if (!review[0]) {
        throw new NotFoundException('Review not found');
      }

      if (review[0].status !== 'PENDING') {
        throw new BadRequestException(
          'Review has already been processed',
        );
      }

      const [updatedReview] = await tx
        .update(propertyReviews)
        .set({
          status: 'RETURNED',
          reviewerId,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(propertyReviews.id, reviewId),
            eq(propertyReviews.status, 'PENDING'),
          ),
        )
        .returning();

      await tx
        .update(assignments)
        .set({
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        })
        .where(eq(assignments.id, review[0].assignmentId));

      return updatedReview;
    });
  }
}