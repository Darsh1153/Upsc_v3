require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const password = 'Darshu@1153';
const projectRef = 'otenrlbuohajthlgjyjh';
const encodedPassword = encodeURIComponent(password);

const formats = [
  {
    name: 'Connection Pooling - US East',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Connection Pooling - AP Southeast',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Connection Pooling - EU West',
    url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: 'Direct Connection',
    url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`
  }
];

async function testFormat(name, url) {
  console.log(`\n🔍 Testing: ${name}`);
  const client = postgres(url, { max: 1, connect_timeout: 10 });
  try {
    const result = await client`SELECT version() as version, current_database() as database`;
    console.log(`   ✅ SUCCESS!`);
    console.log(`   Database: ${result[0].database}`);
    await client.end();
    return url;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
    await client.end();
    return null;
  }
}

(async () => {
  console.log('Testing different connection formats...\n');
  for (const format of formats) {
    const working = await testFormat(format.name, format.url);
    if (working) {
      console.log(`\n✅ Found working connection!`);
      console.log(`\nUpdate .env.local with:`);
      console.log(`DATABASE_URL=${working}`);
      process.exit(0);
    }
  }
  console.log('\n❌ None of the formats worked.');
  console.log('\n💡 Possible issues:');
  console.log('   1. Supabase project might be paused - check dashboard');
  console.log('   2. Database password might be incorrect');
  console.log('   3. Project reference might be wrong');
  console.log('   4. Get exact connection string from: Supabase Dashboard > Connect button');
  process.exit(1);
})();
