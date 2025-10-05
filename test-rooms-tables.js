import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.POSTGRES_URL);

async function checkTables() {
  try {
    const rooms = await sql`SELECT COUNT(*) FROM "Room"`;
    console.log('✅ Room table exists, count:', rooms[0].count);
    
    const participants = await sql`SELECT COUNT(*) FROM "RoomParticipant"`;
    console.log('✅ RoomParticipant table exists, count:', participants[0].count);
    
    console.log('\n✅ All room tables are ready!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
