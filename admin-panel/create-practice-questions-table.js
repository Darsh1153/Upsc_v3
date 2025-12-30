require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

async function createTable() {
    console.log('🔄 Creating practice_questions table...');
    console.log('📝 Using connection:', connectionString.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(connectionString, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    try {
        await sql`SELECT 1`;
        console.log('✅ Database connection successful');

        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS practice_questions (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
                explanation TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);

        console.log('✅ Table "practice_questions" created successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.end();
    }
}

createTable().catch(console.error);
