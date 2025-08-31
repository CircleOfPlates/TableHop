import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import { 
  users, 
  events, 
  neighbourhoods, 
  matchingPool, 
  circles, 
  circleMembers, 
  userPoints, 
  userBadges, 
  emailNotifications,
  testimonials,
  eventRatings,
  pointTransactions,
  pointRedemptions
} from '../src/db/schema';
import { EVENT_STATUS, CIRCLE_FORMAT, CIRCLE_ROLES } from '../src/config/constants';

// Load environment variables
config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool);

async function createDummyData() {
  console.log('🌱 Starting to create dummy data...');

  try {
    // Create neighbourhoods
    console.log('Creating neighbourhoods...');
    const [neighbourhood1, neighbourhood2, neighbourhood3] = await db.insert(neighbourhoods).values([
      {
        name: 'Downtown',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102'
      },
      {
        name: 'Mission District',
        city: 'San Francisco',
        state: 'CA',
        zip: '94110'
      },
      {
        name: 'North Beach',
        city: 'San Francisco',
        state: 'CA',
        zip: '94133'
      }
    ]).returning();

    // Create admin user
    console.log('Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@tablehop.com',
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      role: 'admin',
      neighbourhood: 'Downtown',
      bio: 'Platform administrator',
      dietaryRestrictions: 'None',
      interests: ['cooking', 'meeting new people', 'fine dining'],
      personalityType: 'extrovert',
      cookingExperience: 'expert',
      preferredGroupSize: '6-8',
      socialPreferences: ['group activities', 'conversation']
    }).returning();

    // Create regular users
    console.log('Creating regular users...');
    const userPasswordHash = await bcrypt.hash('password123', 10);
    const regularUsers = await db.insert(users).values([
      {
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: userPasswordHash,
        name: 'John Doe',
        neighbourhood: 'Mission District',
        bio: 'Food enthusiast and amateur chef',
        dietaryRestrictions: 'Vegetarian',
        interests: ['cooking', 'travel', 'wine'],
        personalityType: 'ambivert',
        cookingExperience: 'intermediate',
        preferredGroupSize: '6-8',
        socialPreferences: ['deep conversations', 'food sharing']
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        passwordHash: userPasswordHash,
        name: 'Jane Smith',
        neighbourhood: 'North Beach',
        bio: 'Passionate home cook and food blogger',
        dietaryRestrictions: 'None',
        interests: ['baking', 'photography', 'gardening'],
        personalityType: 'extrovert',
        cookingExperience: 'expert',
        preferredGroupSize: '4-6',
        socialPreferences: ['creative activities', 'storytelling']
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        passwordHash: userPasswordHash,
        name: 'Mike Wilson',
        neighbourhood: 'Downtown',
        bio: 'Tech professional who loves to cook',
        dietaryRestrictions: 'Gluten-free',
        interests: ['technology', 'cooking', 'fitness'],
        personalityType: 'introvert',
        cookingExperience: 'beginner',
        preferredGroupSize: '6-8',
        socialPreferences: ['learning new things', 'casual conversations']
      },
      {
        username: 'sarah_jones',
        email: 'sarah@example.com',
        passwordHash: userPasswordHash,
        name: 'Sarah Jones',
        neighbourhood: 'Mission District',
        bio: 'Restaurant manager and food lover',
        dietaryRestrictions: 'Vegan',
        interests: ['restaurant industry', 'sustainability', 'art'],
        personalityType: 'extrovert',
        cookingExperience: 'advanced',
        preferredGroupSize: '8-10',
        socialPreferences: ['industry networking', 'cultural exchange']
      },
      {
        username: 'david_brown',
        email: 'david@example.com',
        passwordHash: userPasswordHash,
        name: 'David Brown',
        neighbourhood: 'North Beach',
        bio: 'Retired chef with 30 years of experience',
        dietaryRestrictions: 'None',
        interests: ['classic cooking', 'wine pairing', 'mentoring'],
        personalityType: 'ambivert',
        cookingExperience: 'expert',
        preferredGroupSize: '4-6',
        socialPreferences: ['teaching', 'fine dining']
      },
      {
        username: 'emma_davis',
        email: 'emma@example.com',
        passwordHash: userPasswordHash,
        name: 'Emma Davis',
        neighbourhood: 'Downtown',
        bio: 'Food photographer and recipe developer',
        dietaryRestrictions: 'Dairy-free',
        interests: ['photography', 'recipe development', 'travel'],
        personalityType: 'introvert',
        cookingExperience: 'intermediate',
        preferredGroupSize: '6-8',
        socialPreferences: ['creative collaboration', 'food photography']
      },
      {
        username: 'alex_chen',
        email: 'alex@example.com',
        passwordHash: userPasswordHash,
        name: 'Alex Chen',
        neighbourhood: 'Mission District',
        bio: 'Software engineer who loves Asian cuisine',
        dietaryRestrictions: 'None',
        interests: ['asian cooking', 'technology', 'board games'],
        personalityType: 'introvert',
        cookingExperience: 'intermediate',
        preferredGroupSize: '4-6',
        socialPreferences: ['game nights', 'cultural exchange']
      },
      {
        username: 'lisa_garcia',
        email: 'lisa@example.com',
        passwordHash: userPasswordHash,
        name: 'Lisa Garcia',
        neighbourhood: 'North Beach',
        bio: 'Marketing professional and food enthusiast',
        dietaryRestrictions: 'None',
        interests: ['marketing', 'social media', 'healthy cooking'],
        personalityType: 'extrovert',
        cookingExperience: 'beginner',
        preferredGroupSize: '6-8',
        socialPreferences: ['networking', 'healthy lifestyle']
      },
      {
        username: 'tom_anderson',
        email: 'tom@example.com',
        passwordHash: userPasswordHash,
        name: 'Tom Anderson',
        neighbourhood: 'Downtown',
        bio: 'Wine enthusiast and home cook',
        dietaryRestrictions: 'None',
        interests: ['wine', 'cooking', 'music'],
        personalityType: 'extrovert',
        cookingExperience: 'intermediate',
        preferredGroupSize: '6-8',
        socialPreferences: ['wine tasting', 'music sharing']
      },
      {
        username: 'maria_rodriguez',
        email: 'maria@example.com',
        passwordHash: userPasswordHash,
        name: 'Maria Rodriguez',
        neighbourhood: 'Mission District',
        bio: 'Spanish cuisine specialist',
        dietaryRestrictions: 'None',
        interests: ['spanish cooking', 'dancing', 'travel'],
        personalityType: 'extrovert',
        cookingExperience: 'advanced',
        preferredGroupSize: '6-8',
        socialPreferences: ['cultural exchange', 'dancing']
      },
      {
        username: 'james_wilson',
        email: 'james@example.com',
        passwordHash: userPasswordHash,
        name: 'James Wilson',
        neighbourhood: 'North Beach',
        bio: 'BBQ master and grill enthusiast',
        dietaryRestrictions: 'None',
        interests: ['bbq', 'grilling', 'sports'],
        personalityType: 'ambivert',
        cookingExperience: 'expert',
        preferredGroupSize: '4-6',
        socialPreferences: ['sports talk', 'outdoor cooking']
      },
      {
        username: 'anna_kowalski',
        email: 'anna@example.com',
        passwordHash: userPasswordHash,
        name: 'Anna Kowalski',
        neighbourhood: 'Downtown',
        bio: 'Polish cuisine expert and baker',
        dietaryRestrictions: 'None',
        interests: ['baking', 'polish cooking', 'art'],
        personalityType: 'introvert',
        cookingExperience: 'advanced',
        preferredGroupSize: '4-6',
        socialPreferences: ['art appreciation', 'quiet conversations']
      }
    ]).returning();

    // Create events (future dates starting from today 26/08/2025)
    console.log('Creating events...');
    const futureEvents = await db.insert(events).values([
      {
        date: '2025-09-02', // Tuesday, 1 week from today
        startTime: '18:00',
        endTime: '22:00',
        matchingStatus: EVENT_STATUS.OPEN
      },
      {
        date: '2025-09-09', // Tuesday, 2 weeks from today
        startTime: '19:00',
        endTime: '23:00',
        matchingStatus: EVENT_STATUS.OPEN
      },
      {
        date: '2025-09-16', // Tuesday, 3 weeks from today
        startTime: '18:30',
        endTime: '22:30',
        matchingStatus: EVENT_STATUS.OPEN
      },
      {
        date: '2025-09-23', // Tuesday, 4 weeks from today
        startTime: '19:00',
        endTime: '23:00',
        matchingStatus: EVENT_STATUS.OPEN
      },
      {
        date: '2025-09-30', // Tuesday, 5 weeks from today
        startTime: '18:00',
        endTime: '22:00',
        matchingStatus: EVENT_STATUS.OPEN
      }
    ]).returning();

    // Create a past event (1 week ago) that has been completed
    console.log('Creating past completed event...');
    const [pastEvent] = await db.insert(events).values([
      {
        date: '2025-08-19', // Tuesday, 1 week ago
        startTime: '18:00',
        endTime: '22:00',
        matchingStatus: EVENT_STATUS.CLOSED,
        matchingTriggeredAt: new Date('2025-08-17T10:00:00Z'), // 2 days before event
        matchingCompletedAt: new Date('2025-08-17T11:30:00Z') // 1.5 hours later
      }
    ]).returning();

    // Create matching pool entries for future events
    console.log('Creating matching pool entries for future events...');
    await db.insert(matchingPool).values([
      // Event 1 (Sept 2) - 8 users opting in
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[0].id, // John Doe
        partnerId: regularUsers[1].id, // Jane Smith (partner)
        matchAddress: '123 Mission St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[1].id, // Jane Smith
        partnerId: regularUsers[0].id, // John Doe (partner)
        matchAddress: '123 Mission St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[2].id, // Mike Wilson
        matchAddress: '456 Market St, San Francisco, CA 94102',
        hostingAvailable: false
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[3].id, // Sarah Jones
        matchAddress: '789 Valencia St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[4].id, // David Brown
        matchAddress: '321 Columbus Ave, San Francisco, CA 94133',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[5].id, // Emma Davis
        partnerId: regularUsers[6].id, // Alex Chen (partner)
        matchAddress: '654 Grant Ave, San Francisco, CA 94133',
        hostingAvailable: false
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[6].id, // Alex Chen
        partnerId: regularUsers[5].id, // Emma Davis (partner)
        matchAddress: '654 Grant Ave, San Francisco, CA 94133',
        hostingAvailable: false
      },
      {
        eventId: futureEvents[0].id,
        userId: regularUsers[7].id, // Lisa Garcia
        matchAddress: '987 Stockton St, San Francisco, CA 94133',
        hostingAvailable: true
      },
      // Event 2 (Sept 9) - 6 users opting in
      {
        eventId: futureEvents[1].id,
        userId: regularUsers[8].id, // Tom Anderson
        matchAddress: '111 Pine St, San Francisco, CA 94102',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[1].id,
        userId: regularUsers[9].id, // Maria Rodriguez
        matchAddress: '222 Castro St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[1].id,
        userId: regularUsers[10].id, // James Wilson
        matchAddress: '333 Beach St, San Francisco, CA 94133',
        hostingAvailable: true
      },
      {
        eventId: futureEvents[1].id,
        userId: regularUsers[11].id, // Anna Kowalski
        matchAddress: '444 Battery St, San Francisco, CA 94102',
        hostingAvailable: false
      }
    ]);

    // Create matching pool entries for the past event (simulating what happened)
    console.log('Creating matching pool entries for past event...');
    await db.insert(matchingPool).values([
      // Past event had 12 users opting in (enough for 2 circles of 6)
      {
        eventId: pastEvent.id,
        userId: regularUsers[0].id, // John Doe
        partnerId: regularUsers[1].id, // Jane Smith (partner)
        matchAddress: '123 Mission St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[1].id, // Jane Smith
        partnerId: regularUsers[0].id, // John Doe (partner)
        matchAddress: '123 Mission St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[2].id, // Mike Wilson
        matchAddress: '456 Market St, San Francisco, CA 94102',
        hostingAvailable: false
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[3].id, // Sarah Jones
        matchAddress: '789 Valencia St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[4].id, // David Brown
        matchAddress: '321 Columbus Ave, San Francisco, CA 94133',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[5].id, // Emma Davis
        partnerId: regularUsers[6].id, // Alex Chen (partner)
        matchAddress: '654 Grant Ave, San Francisco, CA 94133',
        hostingAvailable: false
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[6].id, // Alex Chen
        partnerId: regularUsers[5].id, // Emma Davis (partner)
        matchAddress: '654 Grant Ave, San Francisco, CA 94133',
        hostingAvailable: false
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[7].id, // Lisa Garcia
        matchAddress: '987 Stockton St, San Francisco, CA 94133',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[8].id, // Tom Anderson
        matchAddress: '111 Pine St, San Francisco, CA 94102',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[9].id, // Maria Rodriguez
        matchAddress: '222 Castro St, San Francisco, CA 94110',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[10].id, // James Wilson
        matchAddress: '333 Beach St, San Francisco, CA 94133',
        hostingAvailable: true
      },
      {
        eventId: pastEvent.id,
        userId: regularUsers[11].id, // Anna Kowalski
        matchAddress: '444 Battery St, San Francisco, CA 94102',
        hostingAvailable: false
      }
    ]);

    // Create circles for the past event (after matching was completed)
    console.log('Creating circles for past event...');
    const [circle1, circle2] = await db.insert(circles).values([
      {
        eventId: pastEvent.id,
        name: 'Circle A',
        format: CIRCLE_FORMAT.ROTATING
      },
      {
        eventId: pastEvent.id,
        name: 'Circle B',
        format: CIRCLE_FORMAT.HOSTED
      }
    ]).returning();

    // Create circle members for the past event
    console.log('Creating circle members for past event...');
    await db.insert(circleMembers).values([
      // Circle A (Rotating) - 6 members
      {
        circleId: circle1.id,
        userId: regularUsers[0].id, // John Doe
        role: CIRCLE_ROLES.STARTER
      },
      {
        circleId: circle1.id,
        userId: regularUsers[1].id, // Jane Smith
        role: CIRCLE_ROLES.MAIN
      },
      {
        circleId: circle1.id,
        userId: regularUsers[2].id, // Mike Wilson
        role: CIRCLE_ROLES.DESSERT
      },
      {
        circleId: circle1.id,
        userId: regularUsers[3].id, // Sarah Jones
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle1.id,
        userId: regularUsers[4].id, // David Brown
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle1.id,
        userId: regularUsers[5].id, // Emma Davis
        role: CIRCLE_ROLES.PARTICIPANT
      },
      // Circle B (Hosted) - 6 members
      {
        circleId: circle2.id,
        userId: regularUsers[6].id, // Alex Chen
        role: CIRCLE_ROLES.HOST
      },
      {
        circleId: circle2.id,
        userId: regularUsers[7].id, // Lisa Garcia
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle2.id,
        userId: regularUsers[8].id, // Tom Anderson
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle2.id,
        userId: regularUsers[9].id, // Maria Rodriguez
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle2.id,
        userId: regularUsers[10].id, // James Wilson
        role: CIRCLE_ROLES.PARTICIPANT
      },
      {
        circleId: circle2.id,
        userId: regularUsers[11].id, // Anna Kowalski
        role: CIRCLE_ROLES.PARTICIPANT
      }
    ]);

    // Create user points for all users
    console.log('Creating user points...');
    await db.insert(userPoints).values([
      {
        userId: regularUsers[0].id,
        points: 150,
        totalPointsEarned: 200
      },
      {
        userId: regularUsers[1].id,
        points: 300,
        totalPointsEarned: 450
      },
      {
        userId: regularUsers[2].id,
        points: 75,
        totalPointsEarned: 100
      },
      {
        userId: regularUsers[3].id,
        points: 200,
        totalPointsEarned: 250
      },
      {
        userId: regularUsers[4].id,
        points: 500,
        totalPointsEarned: 750
      },
      {
        userId: regularUsers[5].id,
        points: 120,
        totalPointsEarned: 180
      },
      {
        userId: regularUsers[6].id,
        points: 80,
        totalPointsEarned: 120
      },
      {
        userId: regularUsers[7].id,
        points: 90,
        totalPointsEarned: 140
      },
      {
        userId: regularUsers[8].id,
        points: 180,
        totalPointsEarned: 220
      },
      {
        userId: regularUsers[9].id,
        points: 250,
        totalPointsEarned: 300
      },
      {
        userId: regularUsers[10].id,
        points: 320,
        totalPointsEarned: 400
      },
      {
        userId: regularUsers[11].id,
        points: 95,
        totalPointsEarned: 130
      }
    ]);

    // Create user badges
    console.log('Creating user badges...');
    await db.insert(userBadges).values([
      {
        userId: regularUsers[0].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[0].id,
        badgeType: 'host_expert'
      },
      {
        userId: regularUsers[1].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[1].id,
        badgeType: 'social_butterfly'
      },
      {
        userId: regularUsers[1].id,
        badgeType: 'food_photographer'
      },
      {
        userId: regularUsers[2].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[3].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[3].id,
        badgeType: 'vegan_chef'
      },
      {
        userId: regularUsers[4].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[4].id,
        badgeType: 'master_chef'
      },
      {
        userId: regularUsers[4].id,
        badgeType: 'mentor'
      },
      {
        userId: regularUsers[5].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[6].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[7].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[8].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[9].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[10].id,
        badgeType: 'first_event'
      },
      {
        userId: regularUsers[11].id,
        badgeType: 'first_event'
      }
    ]);

    // Create testimonials from the past event
    console.log('Creating testimonials...');
    await db.insert(testimonials).values([
      {
        userId: regularUsers[0].id,
        content: 'Amazing experience! The matching system worked perfectly and I met wonderful people.',
        rating: 5,
        neighbourhoodId: neighbourhood2.id
      },
      {
        userId: regularUsers[1].id,
        content: 'Great food and even better company. Can\'t wait for the next event!',
        rating: 5,
        neighbourhoodId: neighbourhood2.id
      },
      {
        userId: regularUsers[3].id,
        content: 'As a vegan, I was worried about food options, but everything was perfect!',
        rating: 5,
        neighbourhoodId: neighbourhood2.id
      },
      {
        userId: regularUsers[4].id,
        content: 'Loved sharing my cooking knowledge with others. The rotating format was brilliant.',
        rating: 5,
        neighbourhoodId: neighbourhood1.id
      },
      {
        userId: regularUsers[6].id,
        content: 'Hosting was a great experience. Everyone was so friendly and appreciative.',
        rating: 5,
        neighbourhoodId: neighbourhood2.id
      },
      {
        userId: regularUsers[8].id,
        content: 'The wine pairing discussions were fantastic. Great group of people!',
        rating: 5,
        neighbourhoodId: neighbourhood1.id
      },
      {
        userId: regularUsers[9].id,
        content: 'Loved sharing Spanish cuisine with everyone. The cultural exchange was wonderful.',
        rating: 5,
        neighbourhoodId: neighbourhood2.id
      }
    ]);

    // Create point transactions from the past event
    console.log('Creating point transactions...');
    await db.insert(pointTransactions).values([
      {
        userId: regularUsers[0].id,
        eventId: pastEvent.id,
        pointsEarned: 50,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[1].id,
        eventId: pastEvent.id,
        pointsEarned: 75,
        reason: 'Hosting bonus',
        details: 'Hosted dinner event'
      },
      {
        userId: regularUsers[2].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[3].id,
        eventId: pastEvent.id,
        pointsEarned: 50,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[4].id,
        eventId: pastEvent.id,
        pointsEarned: 75,
        reason: 'Hosting bonus',
        details: 'Hosted dinner event'
      },
      {
        userId: regularUsers[5].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[6].id,
        eventId: pastEvent.id,
        pointsEarned: 100,
        reason: 'Hosting bonus',
        details: 'Hosted dinner event'
      },
      {
        userId: regularUsers[7].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[8].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[9].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[10].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      },
      {
        userId: regularUsers[11].id,
        eventId: pastEvent.id,
        pointsEarned: 25,
        reason: 'Event participation',
        details: 'Participated in dinner event'
      }
    ]);

    // Create email notifications
    console.log('Creating email notifications...');
    await db.insert(emailNotifications).values([
      {
        userId: regularUsers[0].id,
        type: 'matching_triggered',
        subject: 'Matching has been triggered for your event!',
        body: 'The admin has triggered matching for your upcoming dinner event. You will be notified of your circle assignment soon.',
        status: 'sent'
      },
      {
        userId: regularUsers[1].id,
        type: 'circle_assigned',
        subject: 'You have been assigned to a circle!',
        body: 'You have been assigned to Circle A for the upcoming dinner event. Check your dashboard for details.',
        status: 'sent'
      },
      {
        userId: regularUsers[6].id,
        type: 'circle_assigned',
        subject: 'You have been assigned as a host!',
        body: 'You have been assigned as the host for Circle B. Please prepare to host 5 guests.',
        status: 'sent'
      }
    ]);

    console.log('✅ Dummy data created successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 3 neighbourhoods`);
    console.log(`   - 1 admin user`);
    console.log(`   - ${regularUsers.length} regular users`);
    console.log(`   - 6 events (1 past completed, 5 future)`);
    console.log(`   - 20 matching pool entries (8 for future event, 12 for past event)`);
    console.log(`   - 2 circles with 12 members (for past event)`);
    console.log(`   - User points, badges, testimonials, and notifications`);
    console.log(`\n📅 Event Dates:`);
    console.log(`   - Past: 2025-08-19 (completed with circles)`);
    console.log(`   - Future: 2025-09-02, 2025-09-09, 2025-09-16, 2025-09-23, 2025-09-30`);

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createDummyData().catch(console.error);

