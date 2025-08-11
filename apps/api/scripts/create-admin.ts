import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../src/db/schema';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function createAdminUser() {
  try {
    // Admin user data
    const adminData = {
      username: 'admin',
      email: 'admin@tablehop.com',
      password: 'admin123', // This will be hashed
      name: 'TableHop Admin',
      role: 'admin' as const,
      neighbourhood: 'Admin District',
      bio: 'System administrator for TableHop platform',
      interests: ['community building', 'food', 'technology'],
      personalityType: 'extrovert' as const,
      cookingExperience: 'expert' as const,
      preferredGroupSize: '6-8' as const,
      socialPreferences: ['casual', 'formal', 'outdoor']
    };

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // Insert the admin user using Drizzle ORM
    const result = await db.insert(users).values({
      username: adminData.username,
      email: adminData.email,
      passwordHash: passwordHash,
      name: adminData.name,
      role: adminData.role,
      neighbourhood: adminData.neighbourhood,
      bio: adminData.bio,
      interests: adminData.interests,
      personalityType: adminData.personalityType,
      cookingExperience: adminData.cookingExperience,
      preferredGroupSize: adminData.preferredGroupSize,
      socialPreferences: adminData.socialPreferences
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role
    });

    console.log('✅ Admin user created successfully!');
    console.log('User ID:', result[0].id);
    console.log('Username:', result[0].username);
    console.log('Email:', result[0].email);
    console.log('Role:', result[0].role);
    console.log('\n📝 Login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      console.log('❌ Admin user already exists!');
      console.log('If you need to reset the admin password, please do it manually in the database.');
    } else {
      console.error('❌ Error creating admin user:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    await pool.end();
  }
}

createAdminUser();
