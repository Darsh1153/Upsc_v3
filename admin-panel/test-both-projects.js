require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const password = 'Darshu@1153';
const projects = [
  { ref: 'izyifrlatanmvekbzzph', name: 'New project (from screenshot)' },
  { ref: 'otenrlbuohajthlgjyjh', name: 'Existing project (from .env.local)' }
];

async function testProject(ref, name) {
  console.log(`\n🔍 Testing: ${name} (${ref})`);
  
  const formats = [
    `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  ];
  
  for (const url of formats) {
    const client = postgres(url, { max: 1, connect_timeout: 5 });
    try {
      await client`SELECT 1`;
      console.log(`   ✅ SUCCESS with: ${url.includes('pooler') ? 'Pooling' : 'Direct'}`);
      await client.end();
      return url;
    } catch (error) {
      await client.end();
    }
  }
  return null;
}

(async () => {
  for (const project of projects) {
    const working = await testProject(project.ref, project.name);
    if (working) {
      console.log(`\n✅ Found working connection!`);
      console.log(`\nAdd to .env.local:`);
      console.log(`DATABASE_URL=${working}`);
      process.exit(0);
    }
  }
  console.log('\n❌ Could not connect to either project.');
  console.log('Please verify the password and project reference.');
  process.exit(1);
})();
