require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

async function migrateDatabase() {
    console.log('🔄 Creating question_sets table and updating practice_questions...');
    console.log('📝 Using connection:', connectionString.replace(/:[^:@]+@/, ':****@'));

    const sql = postgres(connectionString, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    try {
        await sql`SELECT 1`;
        console.log('✅ Database connection successful');

        // 1. Create question_sets table
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS question_sets (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                year INTEGER,
                is_published BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('✅ Table "question_sets" created successfully!');

        // 2. Add question_set_id column to practice_questions
        // Check if column exists first to avoid error
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'practice_questions' AND column_name = 'question_set_id'
        `;

        if (columns.length === 0) {
            console.log('➕ Adding question_set_id column to practice_questions...');
            await sql.unsafe(`
                ALTER TABLE practice_questions 
                ADD COLUMN question_set_id INTEGER REFERENCES question_sets(id) ON DELETE CASCADE
            `);
            console.log('✅ Column added successfully');
        } else {
            console.log('ℹ️ Column question_set_id already exists');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.end();
    }
}

migrateDatabase().catch(console.error);
