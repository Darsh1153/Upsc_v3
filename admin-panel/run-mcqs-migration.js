const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

async function runMigration() {
    console.log('🔄 Running article_mcqs table migration...');
    console.log('📝 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    const sql = postgres(connectionString);
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'create_article_mcqs_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Executing migration SQL...');
        
        // Execute the migration
        await sql.unsafe(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        console.log('📊 Table "article_mcqs" has been created.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Table already exists, skipping...');
        } else {
            console.error('💡 Please check:');
            console.error('   1. DATABASE_URL is correct in .env.local');
            console.error('   2. Database connection is working');
            console.error('   3. You have permissions to create tables');
            process.exit(1);
        }
    } finally {
        await sql.end();
    }
}

runMigration();


