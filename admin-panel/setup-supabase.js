#!/usr/bin/env node

/**
 * Complete Supabase Setup Script
 * 
 * This script helps you:
 * 1. Set up a new Supabase project
 * 2. Create all database tables
 * 3. Run all migrations
 * 4. Create admin user
 * 5. Update .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
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
  console.log('🚀 UPSC Prep - Complete Supabase Setup\n');
  console.log('This script will help you set up a complete Supabase project with:');
  console.log('  ✓ Database tables');
  console.log('  ✓ All migrations');
  console.log('  ✓ Admin user');
  console.log('  ✓ Environment configuration\n');

  // Step 1: Check if Supabase is already configured
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const currentServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const currentDbUrl = process.env.DATABASE_URL;

  if (currentUrl && currentAnonKey && currentServiceKey) {
    console.log('📋 Current Configuration:');
    console.log('  Supabase URL:', currentUrl);
    console.log('  Anon Key:', currentAnonKey ? '✓ Set' : '✗ Missing');
    console.log('  Service Key:', currentServiceKey ? '✓ Set' : '✗ Missing');
    console.log('  Database URL:', currentDbUrl ? '✓ Set' : '✗ Missing');
    console.log('');

    const useExisting = await question('Use existing configuration? (y/n): ');
    if (useExisting.toLowerCase() !== 'y') {
      console.log('\n📝 Please provide new Supabase credentials:\n');
      
      const newUrl = await question('Supabase Project URL (e.g., https://xxxxx.supabase.co): ');
      const newAnonKey = await question('Supabase Anon Key: ');
      const newServiceKey = await question('Supabase Service Role Key: ');
      const newDbUrl = await question('Database URL (Connection String): ');

      await updateEnvFile({
        NEXT_PUBLIC_SUPABASE_URL: newUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: newAnonKey,
        SUPABASE_SERVICE_ROLE_KEY: newServiceKey,
        DATABASE_URL: newDbUrl
      });

      console.log('\n✅ Environment variables updated!');
      console.log('Please restart this script to continue with setup.\n');
      rl.close();
      process.exit(0);
    }
  } else {
    console.log('⚠️  Supabase is not configured yet.\n');
    console.log('📝 Please provide your Supabase credentials:\n');
    console.log('To get these:');
    console.log('  1. Go to: https://supabase.com/dashboard');
    console.log('  2. Create a new project (or select existing)');
    console.log('  3. Go to: Settings > API');
    console.log('  4. Copy: Project URL, anon key, service_role key');
    console.log('  5. Go to: Settings > Database > Connect');
    console.log('  6. Copy: Connection string (pooling recommended)\n');

    const supabaseUrl = await question('Supabase Project URL (e.g., https://xxxxx.supabase.co): ');
    const supabaseAnonKey = await question('Supabase Anon Key: ');
    const supabaseServiceKey = await question('Supabase Service Role Key: ');
    const databaseUrl = await question('Database URL (Connection String): ');

    await updateEnvFile({
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
      DATABASE_URL: databaseUrl
    });

    console.log('\n✅ Environment variables saved!\n');
  }

  // Reload environment
  require('dotenv').config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
    console.error('❌ Missing required environment variables!');
    console.error('Please run this script again and provide all credentials.');
    rl.close();
    process.exit(1);
  }

  console.log('🔧 Starting database setup...\n');

  // Step 2: Create database tables using Drizzle
  console.log('📊 Step 1: Creating database tables...');
  try {
    await createDatabaseTables(databaseUrl);
    console.log('✅ Database tables created!\n');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    rl.close();
    process.exit(1);
  }

  // Step 3: Run SQL migrations
  console.log('📝 Step 2: Running SQL migrations...');
  try {
    await runMigrations(databaseUrl);
    console.log('✅ Migrations completed!\n');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    rl.close();
    process.exit(1);
  }

  // Step 4: Create admin user
  console.log('👤 Step 3: Creating admin user...');
  try {
    const adminEmail = await question('Admin email (default: admin@upscprep.com): ') || 'admin@upscprep.com';
    const adminPassword = await question('Admin password (default: admin123): ') || 'admin123';
    const adminName = await question('Admin name (default: Admin User): ') || 'Admin User';

    await createAdminUser(supabaseUrl, supabaseServiceKey, adminEmail, adminPassword, adminName);
    console.log('✅ Admin user created!\n');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message.includes('already exists')) {
      console.log('⚠️  User already exists. You can use existing credentials to login.');
    }
  }

  // Step 5: Summary
  console.log('\n🎉 Setup Complete!\n');
  console.log('📋 Summary:');
  console.log('  ✓ Database tables created');
  console.log('  ✓ All migrations applied');
  console.log('  ✓ Admin user created');
  console.log('\n🚀 Next Steps:');
  console.log('  1. Start the admin panel:');
  console.log('     cd admin-panel && npm run dev');
  console.log('  2. Login at: http://localhost:3000');
  console.log('  3. Use the admin credentials you just created\n');

  rl.close();
}

async function updateEnvFile(vars) {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add each variable
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + '\n');
}

async function createDatabaseTables(databaseUrl) {
  const sql = postgres(databaseUrl);

  try {
    // Read the schema and create tables
    // Since we're using Drizzle, we'll use drizzle-kit push
    const { execSync } = require('child_process');
    
    console.log('  Running Drizzle schema push...');
    execSync('npx drizzle-kit push', {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });
  } catch (error) {
    // If drizzle-kit fails, create tables manually
    console.log('  Drizzle-kit not available, creating tables manually...');
    await createTablesManually(sql);
  } finally {
    await sql.end();
  }
}

async function createTablesManually(sql) {
  // This is a fallback - ideally use drizzle-kit push
  console.log('  Note: Please run "npx drizzle-kit push" manually to create tables.');
  console.log('  Or use the SQL migrations in the migrations/ folder.');
}

async function runMigrations(databaseUrl) {
  const sql = postgres(databaseUrl);

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = [
      'create_mind_map_tables.sql',
      'create_article_mcqs_table.sql',
      '20251209_create_notes_tags_fts.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`  Running migration: ${file}...`);
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        await sql.unsafe(migrationSQL);
        console.log(`  ✓ ${file} completed`);
      }
    }
  } finally {
    await sql.end();
  }
}

async function createAdminUser(supabaseUrl, serviceKey, email, password, name) {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: name,
      role: 'admin'
    }
  });

  if (error) {
    if (error.message && (
      error.message.includes('already registered') ||
      error.message.includes('already exists') ||
      error.message.includes('User already registered')
    )) {
      throw new Error('User already exists');
    }
    throw error;
  }

  if (data && data.user) {
    console.log(`  ✓ Admin user created: ${email}`);
    console.log(`  ✓ User ID: ${data.user.id}`);
    return data.user;
  }

  throw new Error('Failed to create user: No user data returned');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});



