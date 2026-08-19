import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  text,
  jsonb,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'DATA_CHECKER',
  'REVIEWER',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'OPEN',
  'CLAIMED',
  'IN_PROGRESS',
  'SUBMITTED',
  'COMPLETED',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RETURNED',
]);

export const propertyStatusEnum = pgEnum('property_status', [
  'VERIFIED',
  'PENDING_VERIFICATION',
]);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),

    name: varchar('name', { length: 255 }).notNull(),

    email: varchar('email', { length: 255 }).notNull().unique(),

    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    role: userRoleEnum('role').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('users_role_idx').on(table.role),
  ],
);

export const properties = pgTable(
  'properties',
  {
    id: serial('id').primaryKey(),

    address: varchar('address', { length: 500 }).notNull(),

    city: varchar('city', { length: 100 }).notNull(),

    state: varchar('state', { length: 100 }).notNull(),

    zip: varchar('zip', { length: 20 }).notNull(),

    bedrooms: integer('bedrooms'),

    bathrooms: integer('bathrooms'),

    propertyType: varchar('property_type', { length: 100 }),

    yearBuilt: integer('year_built'),

    livingArea: integer('living_area'),

    lotSize: integer('lot_size'),

    heating: varchar('heating', { length: 100 }),

    cooling: varchar('cooling', { length: 100 }),

    water: varchar('water', { length: 100 }),

    sewer: varchar('sewer', { length: 100 }),

    appliances: jsonb('appliances'),

    features: jsonb('features'),

    listingAgent: varchar('listing_agent', { length: 255 }),

    buyerAgent: varchar('buyer_agent', { length: 255 }),

    status: propertyStatusEnum('status')
      .default('VERIFIED')
      .notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('properties_state_idx').on(table.state),
    index('properties_city_idx').on(table.city),
    index('properties_zip_idx').on(table.zip),
    index('properties_status_idx').on(table.status),
  ],
);

export const assignments = pgTable(
  'assignments',
  {
    id: serial('id').primaryKey(),

    title: varchar('title', { length: 255 }).notNull(),

    status: assignmentStatusEnum('status')
      .default('OPEN')
      .notNull(),

    checkerId: integer('checker_id').references(() => users.id),

    totalProperties: integer('total_properties').default(0).notNull(),

    estimatedCompletionMinutes: integer(
      'estimated_completion_minutes',
    ),

    createdBy: integer('created_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    claimedAt: timestamp('claimed_at', { withTimezone: true }),
  },
  (table) => [
    index('assignments_status_idx').on(table.status),
    index('assignments_checker_idx').on(table.checkerId),
    index('assignments_created_by_idx').on(table.createdBy),
  ],
);

export const assignmentProperties = pgTable(
  'assignment_properties',
  {
    id: serial('id').primaryKey(),

    assignmentId: integer('assignment_id')
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),

    propertyId: integer('property_id')
      .notNull()
      .references(() => properties.id),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('assignment_property_unique').on(
      table.assignmentId,
      table.propertyId,
    ),
    index('assignment_properties_assignment_idx').on(
      table.assignmentId,
    ),
    index('assignment_properties_property_idx').on(
      table.propertyId,
    ),
  ],
);

export const propertyReviews = pgTable(
  'property_reviews',
  {
    id: serial('id').primaryKey(),

    assignmentId: integer('assignment_id')
      .notNull()
      .references(() => assignments.id),

    propertyId: integer('property_id')
      .notNull()
      .references(() => properties.id),

    checkerId: integer('checker_id')
      .notNull()
      .references(() => users.id),

    reviewerId: integer('reviewer_id').references(() => users.id),

    oldValues: jsonb('old_values').notNull(),

    newValues: jsonb('new_values').notNull(),

    notes: text('notes'),

    status: reviewStatusEnum('status')
      .default('PENDING')
      .notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    index('property_reviews_assignment_idx').on(
      table.assignmentId,
    ),
    index('property_reviews_property_idx').on(
      table.propertyId,
    ),
    index('property_reviews_status_idx').on(table.status),
    index('property_reviews_reviewer_idx').on(
      table.reviewerId,
    ),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),

    propertyId: integer('property_id')
      .notNull()
      .references(() => properties.id),

    userId: integer('user_id')
      .notNull()
      .references(() => users.id),

    changedFields: jsonb('changed_fields').notNull(),

    oldValues: jsonb('old_values').notNull(),

    newValues: jsonb('new_values').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('audit_logs_property_idx').on(table.propertyId),
    index('audit_logs_user_idx').on(table.userId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);