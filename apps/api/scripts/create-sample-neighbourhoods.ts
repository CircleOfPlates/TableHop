import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { neighbourhoods } from '../src/db/schema'
import 'dotenv/config'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool)

async function createSampleNeighbourhoods() {
  try {
    const sampleNeighbourhoods = [
      {
        name: 'Downtown District',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M5V 3A8',
      },
      {
        name: 'West End Community',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M6R 1A1',
      },
      {
        name: 'East Side Village',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M4E 1A1',
      },
      {
        name: 'North End Heights',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M4N 1A1',
      },
    ]

    for (const neighbourhoodData of sampleNeighbourhoods) {
      const [newNeighbourhood] = await db.insert(neighbourhoods).values(neighbourhoodData).returning()
      console.log(`✅ Created neighbourhood: ${newNeighbourhood.name}`)
    }

    console.log('\n🎉 Sample neighbourhoods created successfully!')

  } catch (error: any) {
    if (error.code === '23505') {
      console.log('❌ Some neighbourhoods already exist!')
    } else {
      console.error('❌ Error creating sample neighbourhoods:', error.message)
      console.error('Full error:', error)
    }
  } finally {
    await pool.end()
  }
}

createSampleNeighbourhoods()
