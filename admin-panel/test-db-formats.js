// Test different database connection formats
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

const password = 'Darshu@1153';
const projectRef = 'izyifrlatanmvekbzzph';

// Different connection string formats to try
const formats = [
  {
    name: 'Direct Connection (port 5432)',
    url: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: 'Connection Pooling (port 6543)',
    url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Connection Pooling (alternative region)',
    url: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Direct with URL-encoded @',
    url: `postgresql://postgres:Darshu%401153@db.${projectRef}.supabase.co:5432/postgres`
  }
];

async function testConnection(name, url) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url.replace(/:[^:@]+@/, ':****@')}`);
  
  const client = postgres(url, {
    max: 1,
    connect_timeout: 5
  });
  
  try {
    const result = await client`SELECT version() as version, current_database() as database`;
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Database: ${result[0].database}`);
    await client.end();
    return url;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    await client.end();
    return null;
  }
}

async function testAll() {
  console.log('Testing different connection string formats...\n');
  
  for (const format of formats) {
    const workingUrl = await testConnection(format.name, format.url);
    if (workingUrl) {
      console.log(`\n✅ Working connection string found!`);
      console.log(`\nAdd this to your .env.local:`);
      console.log(`DATABASE_URL=${workingUrl}`);
      process.exit(0);
    }
  }
  
  console.log('\n❌ None of the connection formats worked.');
  console.log('\n💡 Please check:');
  console.log('   1. Your database password is correct');
  console.log('   2. Your project reference is correct (izyifrlatanmvekbzzph)');
  console.log('   3. Your Supabase project is active');
  console.log('   4. Try getting the connection string from Supabase Dashboard > Connect button');
  process.exit(1);
}

testAll();


