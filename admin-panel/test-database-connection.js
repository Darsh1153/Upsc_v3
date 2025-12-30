// Test database connection
require('dotenv').config({ path: '.env.local' });

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('Testing database connection...\n');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password

const client = postgres(connectionString);
const db = drizzle(client);

async function testConnection() {
  try {
    // Test basic connection
    const result = await client`SELECT version() as version, current_database() as database`;
    console.log('✅ Database connection successful!\n');
    console.log('Database:', result[0].database);
    console.log('PostgreSQL version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    
    // Test if we can query
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Found ${tables.length} tables in public schema:`);
    if (tables.length > 0) {
      tables.slice(0, 10).forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`   ... and ${tables.length - 10} more`);
      }
    } else {
      console.log('   (No tables found - you may need to run migrations)');
    }
    
    console.log('\n✅ Database is ready to use!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('password authentication')) {
      console.error('\n💡 Tip: Check if your password is correct and URL-encoded.');
      console.error('   Special characters like @ should be encoded as %40');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 Tip: Check if the hostname is correct.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();


