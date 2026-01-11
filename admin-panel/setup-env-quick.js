#!/usr/bin/env node

/**
 * Quick .env.local setup with your project ID
 * Project ID: sfukhupkvsjaqkbiskbj
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const PROJECT_ID = 'sfukhupkvsjaqkbiskbj';
  const PROJECT_URL = `https://${PROJECT_ID}.supabase.co`;

  console.log('🚀 Quick .env.local Setup\n');
  console.log(`📌 Your Project ID: ${PROJECT_ID}`);
  console.log(`📌 Your Project URL: ${PROJECT_URL}\n`);
  console.log('📋 Get these from Supabase Dashboard:\n');
  console.log('   1. Settings > API:');
  console.log('      - anon public key');
  console.log('      - service_role key');
  console.log('');
  console.log('   2. Settings > Database > Connect:');
  console.log('      - Connection string (pooling)');
  console.log('      - Replace [YOUR-PASSWORD] with your password');
  console.log('      - URL-encode @ → %40\n');

  const anonKey = await question('Paste anon public key: ');
  const serviceKey = await question('Paste service_role key: ');
  const dbPassword = await question('Database password: ');
  const region = await question('Region (e.g., ap-southeast-1, us-east-1): ') || 'ap-southeast-1';

  if (!anonKey || !serviceKey || !dbPassword) {
    console.error('\n❌ All fields are required!');
    rl.close();
    process.exit(1);
  }

  // URL-encode password
  const encodedPassword = encodeURIComponent(dbPassword);

  // Build DATABASE_URL
  const databaseUrl = `postgresql://postgres.${PROJECT_ID}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`;

  // Create .env.local content
  const envContent = `# Supabase Configuration
# Project ID: ${PROJECT_ID}
# Generated automatically

NEXT_PUBLIC_SUPABASE_URL=${PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# Database Connection (Connection Pooling)
DATABASE_URL=${databaseUrl}
`;

  // Write to file
  const envPath = path.join(__dirname, '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ .env.local file created successfully!\n');
  console.log('📁 Location:', envPath);
  console.log('\n📝 Next steps:');
  console.log('   1. Create admin user in Supabase Dashboard');
  console.log('   2. Test connection: node test-database-connection.js');
  console.log('   3. Start app: npm run dev\n');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});



