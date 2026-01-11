#!/usr/bin/env node

/**
 * Create .env.local file with provided credentials
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'sfukhupkvsjaqkbiskbj';
const PROJECT_URL = `https://${PROJECT_ID}.supabase.co`;
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWtodXBrdnNqYXFrYmlza2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjc2OTksImV4cCI6MjA4MzcwMzY5OX0.QNoNp3QzSJ6hIpf8Gmh3X8W8SCHREs3JKkN7OgmHbQg';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdWtodXBrdnNqYXFrYmlza2JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEyNzY5OSwiZXhwIjoyMDgzNzAzNjk5fQ.o1ZCcxY1tkMMRywKZeG39McK-mgX8AD5SahwrEMwtrM';

// Get password and region from command line or use defaults
const password = process.argv[2] || process.env.DB_PASSWORD;
const region = process.argv[3] || process.env.DB_REGION || 'ap-southeast-1';

if (!password) {
  console.log('🔧 Creating .env.local file...\n');
  console.log('✅ Anon key: Set');
  console.log('✅ Service key: Set');
  console.log('❌ Database password: Missing\n');
  console.log('Usage:');
  console.log('  node create-env-file.js <database-password> [region]');
  console.log('  Example: node create-env-file.js MyPass@123 ap-southeast-1\n');
  console.log('Or set environment variables:');
  console.log('  DB_PASSWORD=MyPass@123 DB_REGION=ap-southeast-1 node create-env-file.js\n');
  process.exit(1);
}

// URL-encode password
const encodedPassword = encodeURIComponent(password);

// Build DATABASE_URL
const databaseUrl = `postgresql://postgres.${PROJECT_ID}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:6543/postgres`;

// Create .env.local content
const envContent = `# Supabase Configuration
# Project ID: ${PROJECT_ID}
# Generated automatically

NEXT_PUBLIC_SUPABASE_URL=${PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}

# Database Connection (Connection Pooling)
DATABASE_URL=${databaseUrl}
`;

// Write to file
const envPath = path.join(__dirname, '.env.local');
fs.writeFileSync(envPath, envContent);

console.log('✅ .env.local file created successfully!\n');
console.log('📁 Location:', envPath);
console.log('📋 Configuration:');
console.log(`   Project URL: ${PROJECT_URL}`);
console.log(`   Database URL: postgresql://postgres.${PROJECT_ID}:***@aws-0-${region}.pooler.supabase.com:6543/postgres`);
console.log('\n🎉 Setup complete! Next steps:');
console.log('   1. Test connection: node test-database-connection.js');
console.log('   2. Create admin user in Supabase Dashboard');
console.log('   3. Start app: npm run dev\n');

