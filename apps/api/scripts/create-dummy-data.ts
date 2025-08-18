import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import * as schema from '../src/db/schema';

// Load environment variables
config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

async function createDummyData() {
  console.log('🔄 Starting dummy data creation...');
  
  try {
    // Create neighbourhoods
    console.log('📝 Creating neighbourhoods...');
    const neighbourhoods = await db.insert(schema.neighbourhoods).values([
      {
        name: 'Downtown District',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      {
        name: 'Brooklyn Heights',
        city: 'New York',
        state: 'NY',
        zip: '11201',
      },
      {
        name: 'Queens Village',
        city: 'New York',
        state: 'NY',
        zip: '11427',
      },
      {
        name: 'Manhattan West',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      {
        name: 'Admin District',
        city: 'System',
        state: 'SY',
        zip: '00000',
      },
    ]).returning();

    console.log(`✅ Created ${neighbourhoods.length} neighbourhoods`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await db.insert(schema.users).values({
      username: 'admin',
      email: 'admin@tablehop.com',
      passwordHash: hashedPassword,
      name: 'TableHop Admin',
      role: 'admin',
      neighbourhood: 'Admin District',
      phone: '+1-555-0000',
      address: '123 Admin St',
      bio: 'System administrator for TableHop platform',
      dietaryRestrictions: 'None',
      interests: ['admin', 'management'],
      dateOfBirth: '1990-01-01',
      personalityType: 'extrovert',
      cookingExperience: 'advanced',
      preferredGroupSize: 'medium',
      socialPreferences: ['casual'],
    }).returning();

    console.log(`✅ Created admin user: ${adminUser[0].username}`);

    // Create sample regular users
    console.log('👥 Creating sample users...');
    const sampleUsers = await db.insert(schema.users).values([
      {
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        role: 'user',
        neighbourhood: 'Downtown District',
        phone: '+1-555-0001',
        address: '456 Main St',
        bio: 'Food enthusiast and community builder',
        dietaryRestrictions: 'Vegetarian',
        interests: ['cooking', 'travel', 'wine'],
        dateOfBirth: '1985-05-15',
        personalityType: 'extrovert',
        cookingExperience: 'intermediate',
        preferredGroupSize: 'medium',
        socialPreferences: ['lively_energetic'],
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        role: 'user',
        neighbourhood: 'Brooklyn Heights',
        phone: '+1-555-0002',
        address: '789 Oak Ave',
        bio: 'Passionate home cook and neighborhood connector',
        dietaryRestrictions: 'None',
        interests: ['cooking', 'gardening', 'photography'],
        dateOfBirth: '1990-08-22',
        personalityType: 'ambivert',
        cookingExperience: 'advanced',
        preferredGroupSize: 'small',
        socialPreferences: ['quiet_intimate'],
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Mike Wilson',
        role: 'user',
        neighbourhood: 'Queens Village',
        phone: '+1-555-0003',
        address: '321 Pine St',
        bio: 'New to the area, excited to meet neighbors',
        dietaryRestrictions: 'Gluten-free',
        interests: ['sports', 'fitness', 'movies'],
        dateOfBirth: '1988-12-10',
        personalityType: 'introvert',
        cookingExperience: 'beginner',
        preferredGroupSize: 'large',
        socialPreferences: ['casual'],
      },
    ]).returning();

    console.log(`✅ Created ${sampleUsers.length} sample users`);

    // Create sample events
    console.log('🎉 Creating sample events...');
    const sampleEvents = await db.insert(schema.events).values([
      {
        title: 'Downtown Dinner Delight',
        description: 'Join us for a rotating dinner party featuring international cuisine',
        date: '2025-09-15',
        startTime: '18:00',
        endTime: '22:00',
        totalSpots: 6,
        format: 'rotating',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Downtown District')?.id || 1,
      },
      {
        title: 'Brooklyn Heights Hosted Dinner',
        description: 'A cozy hosted dinner party with homemade Italian dishes',
        date: '2025-09-20',
        startTime: '19:00',
        endTime: '23:00',
        totalSpots: 8,
        format: 'hosted',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Brooklyn Heights')?.id || 2,
      },
      {
        title: 'Queens Village Community Feast',
        description: 'Celebrate our diverse community with a potluck-style dinner',
        date: '2025-09-25',
        startTime: '17:30',
        endTime: '21:30',
        totalSpots: 12,
        format: 'hosted',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Queens Village')?.id || 3,
      },
      {
        title: 'Manhattan West Rotating Dinner',
        description: 'Experience three amazing courses across different homes in Manhattan West',
        date: '2025-10-05',
        startTime: '18:30',
        endTime: '22:30',
        totalSpots: 6,
        format: 'rotating',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Manhattan West')?.id || 4,
      },
      {
        title: 'Downtown Autumn Gathering',
        description: 'A seasonal hosted dinner featuring fall flavors and warm company',
        date: '2025-10-12',
        startTime: '19:00',
        endTime: '23:00',
        totalSpots: 10,
        format: 'hosted',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Downtown District')?.id || 1,
      },
      {
        title: 'Brooklyn Heights International Night',
        description: 'Travel the world through food with our rotating international dinner',
        date: '2025-10-18',
        startTime: '18:00',
        endTime: '22:00',
        totalSpots: 6,
        format: 'rotating',
        neighbourhoodId: neighbourhoods.find(n => n.name === 'Brooklyn Heights')?.id || 2,
      },
    ]).returning();

    console.log(`✅ Created ${sampleEvents.length} sample events`);

    // Create some participants
    console.log('👥 Creating participants...');
    const participants = await db.insert(schema.participants).values([
      {
        eventId: sampleEvents[0].id,
        userId: sampleUsers[0].id,
        coursePreference: 'main',
        isHost: true,
      },
      {
        eventId: sampleEvents[0].id,
        userId: sampleUsers[1].id,
        coursePreference: 'starter',
        isHost: false,
      },
      {
        eventId: sampleEvents[1].id,
        userId: sampleUsers[2].id,
        isHost: true,
      },
      {
        eventId: sampleEvents[3].id, // Manhattan West Rotating Dinner
        userId: sampleUsers[0].id,
        coursePreference: 'dessert',
        isHost: false,
      },
      {
        eventId: sampleEvents[4].id, // Downtown Autumn Gathering
        userId: sampleUsers[1].id,
        isHost: true,
      },
    ]).returning();

    console.log(`✅ Created ${participants.length} participants`);

    // Create sample user points
    console.log('⭐ Creating user points...');
    const userPoints = await db.insert(schema.userPoints).values([
      {
        userId: sampleUsers[0].id,
        points: 120,
        totalPointsEarned: 150,
      },
      {
        userId: sampleUsers[1].id,
        points: 180,
        totalPointsEarned: 200,
      },
      {
        userId: sampleUsers[2].id,
        points: 75,
        totalPointsEarned: 75,
      },
    ]).returning();

    console.log(`✅ Created ${userPoints.length} user points records`);

    // Create sample badges
    console.log('🏆 Creating user badges...');
    const userBadges = await db.insert(schema.userBadges).values([
      {
        userId: sampleUsers[0].id,
        badgeType: 'first_host',
      },
      {
        userId: sampleUsers[1].id,
        badgeType: 'great_guest',
      },
      {
        userId: sampleUsers[1].id,
        badgeType: 'connector',
      },
    ]).returning();

    console.log(`✅ Created ${userBadges.length} user badges`);

    console.log('🎉 Dummy data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${neighbourhoods.length} neighbourhoods`);
    console.log(`   • ${adminUser.length} admin user`);
    console.log(`   • ${sampleUsers.length} sample users`);
    console.log(`   • ${sampleEvents.length} sample events`);
    console.log(`   • ${participants.length} participants`);
    console.log(`   • ${userPoints.length} user points records`);
    console.log(`   • ${userBadges.length} user badges`);
    
    console.log('\n🔑 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@tablehop.com');

    console.log('\n👤 Sample user credentials:');
    console.log('   Username: john_doe, jane_smith, mike_wilson');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script if executed directly
if (require.main === module) {
  createDummyData()
    .then(() => {
      console.log('✅ Dummy data creation script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dummy data creation failed:', error);
      process.exit(1);
    });
}

export { createDummyData };
