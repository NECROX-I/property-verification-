import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users, properties } from '../src/database/schema';

const propertyTypes = [
  'Single Family',
  'Condo',
  'Townhouse',
];

const states = [
  'California',
  'Texas',
  'Florida',
  'New York',
  'Arizona',
  'Colorado',
  'Washington',
  'Georgia',
  'Illinois',
  'North Carolina',
];

const cities = [
  'Los Angeles',
  'Austin',
  'Miami',
  'Buffalo',
  'Phoenix',
  'Denver',
  'Seattle',
  'Atlanta',
  'Chicago',
  'Charlotte',
];

function createProperties() {
  return Array.from({ length: 50 }, (_, index) => {
    const cityIndex = index % cities.length;

    return {
      address: `${100 + index} ${['Main', 'Oak', 'Maple', 'Pine', 'Cedar'][index % 5]} Street`,
      city: cities[cityIndex],
      state: states[cityIndex],
      zip: `${10000 + index}`,
      bedrooms: 2 + (index % 4),
      bathrooms: 1 + (index % 3),
      propertyType: propertyTypes[index % propertyTypes.length],
      yearBuilt: 1980 + (index % 40),
      livingArea: 1000 + index * 50,
      lotSize: 4000 + index * 100,
      heating: index % 2 === 0 ? 'Central' : 'Forced Air',
      cooling: index % 2 === 0 ? 'Central Air' : 'Window Units',
      water: 'Public',
      sewer: 'Public',
      appliances: [
        'Refrigerator',
        'Dishwasher',
        'Oven',
      ],
      features: [
        'Garage',
        'Hardwood Floors',
      ],
      listingAgent: `Agent ${index + 1}`,
      buyerAgent: `Buyer Agent ${index + 1}`,
      status: 'VERIFIED' as const,
    };
  });
}

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash('password123', 10);

  await db
    .insert(users)
    .values([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash,
        role: 'ADMIN',
      },
      {
        name: 'Data Checker',
        email: 'checker@example.com',
        passwordHash,
        role: 'DATA_CHECKER',
      },
      {
        name: 'Reviewer User',
        email: 'reviewer@example.com',
        passwordHash,
        role: 'REVIEWER',
      },
    ])
    .onConflictDoNothing();

  const existingProperties = await db
    .select({ id: properties.id })
    .from(properties);

  if (existingProperties.length === 0) {
    await db.insert(properties).values(createProperties());
    console.log('50 properties seeded successfully');
  } else {
    console.log('Properties already exist, skipping property seed');
  }

  console.log('Users seeded successfully');

  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});