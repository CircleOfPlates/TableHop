import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { events, neighbourhoods } from '../src/db/schema'
import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool)

async function createSampleEvents() {
  try {
    // First, let's check if we have any neighbourhoods
    const existingNeighbourhoods = await db.select().from(neighbourhoods)
    
    if (existingNeighbourhoods.length === 0) {
      console.log('❌ No neighbourhoods found. Please create neighbourhoods first.')
      return
    }

    const neighbourhoodId = existingNeighbourhoods[0].id

    // Create sample events
    const sampleEvents = [
      {
        title: 'Spring Rotating Dinner',
        description: 'Join us for a delightful spring evening with three courses across different homes. Experience the magic of rotating dinners!',
        neighbourhoodId,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        startTime: '18:00',
        endTime: '22:00',
        totalSpots: 12,
        spotsRemaining: 12,
        format: 'rotating' as const,
        isWaitlist: false,
      },
      {
        title: 'Cozy Hosted Dinner',
        description: 'A warm, intimate dinner party hosted by Sarah. All courses served in one beautiful home with optional contributions from guests.',
        neighbourhoodId,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        startTime: '19:00',
        endTime: '23:00',
        totalSpots: 8,
        spotsRemaining: 8,
        format: 'hosted' as const,
        isWaitlist: false,
      },
      {
        title: 'Summer Rotating Feast',
        description: 'Celebrate summer with fresh ingredients and great company. Three homes, three amazing courses!',
        neighbourhoodId,
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days from now
        startTime: '18:30',
        endTime: '22:30',
        totalSpots: 15,
        spotsRemaining: 15,
        format: 'rotating' as const,
        isWaitlist: false,
      },
      {
        title: 'Wine & Dine Hosted Evening',
        description: 'An elegant evening of fine dining and wine pairing. Perfect for food enthusiasts and wine lovers.',
        neighbourhoodId,
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 28 days from now
        startTime: '19:30',
        endTime: '23:30',
        totalSpots: 6,
        spotsRemaining: 6,
        format: 'hosted' as const,
        isWaitlist: false,
      },
    ]

    for (const eventData of sampleEvents) {
      const [newEvent] = await db.insert(events).values(eventData).returning()
      console.log(`✅ Created event: ${newEvent.title}`)
    }

    console.log('\n🎉 Sample events created successfully!')
    console.log('You can now test the events functionality in the frontend.')

  } catch (error: any) {
    console.error('❌ Error creating sample events:', error.message)
    console.error('Full error:', error)
  } finally {
    await pool.end()
  }
}

createSampleEvents()
