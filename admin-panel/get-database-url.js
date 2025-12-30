// Helper script to construct Supabase DATABASE_URL
// Run: node get-database-url.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔗 Supabase Database Connection String Helper\n');
console.log('You need two pieces of information:');
console.log('1. Your database password (from Supabase Dashboard > Settings > Database)');
console.log('2. Your project reference (from your Supabase URL)\n');

// Get project reference from .env.local if available
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

let projectRef = '';
if (supabaseUrl) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    projectRef = match[1];
    console.log(`✓ Found project reference from .env.local: ${projectRef}\n`);
  }
}

rl.question('Enter your database password (or press Enter to use project reference only): ', (password) => {
  if (!projectRef) {
    rl.question('Enter your project reference (from Supabase URL, e.g., izyifrlatanmvekbzzph): ', (ref) => {
      projectRef = ref.trim();
      generateConnectionString(projectRef, password);
      rl.close();
    });
  } else {
    generateConnectionString(projectRef, password);
    rl.close();
  }
});

function generateConnectionString(projectRef, password) {
  console.log('\n📋 Connection String Options:\n');
  
  // Option 1: Connection Pooling (Recommended for server-side)
  if (password) {
    const poolerUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    console.log('1. Connection Pooling (Recommended):');
    console.log(poolerUrl);
    console.log('\n   Add this to your .env.local:');
    console.log(`   DATABASE_URL="${poolerUrl}"\n`);
  }
  
  // Option 2: Direct Connection
  if (password) {
    const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
    console.log('2. Direct Connection:');
    console.log(directUrl);
    console.log('\n   Or add this to your .env.local:');
    console.log(`   DATABASE_URL="${directUrl}"\n`);
  }
  
  if (!password) {
    console.log('⚠️  You need to provide your database password.');
    console.log('   Get it from: Supabase Dashboard > Settings > Database > Database password');
    console.log('   Or reset it using the "Reset database password" button.\n');
    console.log('   Once you have the password, the connection string format is:');
    console.log(`   postgresql://postgres.${projectRef}:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`);
    console.log(`   OR`);
    console.log(`   postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres\n`);
  }
  
  console.log('💡 Tip: Connection pooling is better for server applications.');
  console.log('   Direct connection is simpler but has connection limits.\n');
}


