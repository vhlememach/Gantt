import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const usersData = [
  { email: 'victor.leme@zengate.global', password: 'h3izTMt8DBThwM45Xw9pd5@S^XCU', isAdmin: true },
  { email: 'brian.dill@zengate.global', password: 'ABY9DDLbpf^Vpqv5Pr28yA4bymJk', isAdmin: false },
  { email: 'alex.schwartz@zengate.global', password: 'f7YG5FAHNLT6Re#np7bC&nhVTNDY', isAdmin: false },
  { email: 'lucas.marinho@zengate.global', password: 'QX9dJZ$Au272Pi#oTXE7hiB#NU9&', isAdmin: false },
  { email: 'theodore.morisis@zengate.global', password: '$Psmm9VaWFBt2bgCqDvmwWRHne8K', isAdmin: false },
  { email: 'visitor', password: '5jPvLErY$Lvg#N9r%bQ5RsUiDNAq', isAdmin: false }
];

async function seedUsers() {
  console.log('Starting user seeding...');
  
  for (const userData of usersData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Check if user already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (!existing) {
        await db.insert(users).values({
          email: userData.email,
          password: hashedPassword,
          isAdmin: userData.isAdmin
        });
        console.log(`✓ Created user: ${userData.email}`);
      } else {
        console.log(`- User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('User seeding completed!');
  process.exit(0);
}

seedUsers().catch(console.error);