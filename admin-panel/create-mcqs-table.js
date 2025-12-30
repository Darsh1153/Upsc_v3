require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

async function createTable() {
    console.log('🔄 Creating article_mcqs table...');
    console.log('📝 Using connection:', connectionString.replace(/:[^:@]+@/, ':****@'));
    
    const sql = postgres(connectionString, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });
    
    try {
        // Test connection first
        await sql`SELECT 1`;
        console.log('✅ Database connection successful');
        
        // Create the table
        console.log('📄 Creating article_mcqs table...');
        await sql.unsafe(`
            CREATE TABLE IF NOT EXISTS article_mcqs (
                id SERIAL PRIMARY KEY,
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
                explanation TEXT,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        
        // Create index
        console.log('📊 Creating index...');
        await sql.unsafe(`
            CREATE INDEX IF NOT EXISTS idx_article_mcqs_article_id ON article_mcqs(article_id)
        `);
        
        console.log('✅ Table "article_mcqs" created successfully!');
        
        // Verify table exists
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'article_mcqs'
        `;
        
        if (tables.length > 0) {
            console.log('✅ Verification: Table exists in database');
        }
        
    } catch (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log('ℹ️  Table already exists, skipping...');
        } else {
            console.error('❌ Error:', error.message);
            console.error('💡 Full error:', error);
            if (error.code === 'ECONNREFUSED') {
                console.error('💡 Database connection refused. Check if:');
                console.error('   1. Database server is running');
                console.error('   2. DATABASE_URL is correct');
            } else if (error.code === '28P01') {
                console.error('💡 Authentication failed. Check DATABASE_URL credentials');
            } else if (error.code === '3D000') {
                console.error('💡 Database does not exist. Create it first');
            }
            process.exit(1);
        }
    } finally {
        await sql.end();
    }
}

createTable().catch(console.error);


