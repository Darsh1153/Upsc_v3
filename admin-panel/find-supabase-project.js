// Script to help find the correct Supabase project
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Configuration Check\n');
console.log('Current Configuration:');
console.log('  URL:', supabaseUrl || '❌ NOT SET');
console.log('  Anon Key:', supabaseAnonKey ? '✓ Set' : '❌ NOT SET');
console.log('  Service Key:', supabaseServiceKey ? '✓ Set' : '❌ NOT SET');
console.log('');

if (supabaseUrl) {
  const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (projectMatch) {
    const projectId = projectMatch[1];
    console.log('📋 Project ID from URL:', projectId);
    console.log('');
    console.log('🌐 Dashboard URLs:');
    console.log('  - Project Dashboard: https://supabase.com/dashboard/project/' + projectId);
    console.log('  - Auth Users: https://supabase.com/dashboard/project/' + projectId + '/auth/users');
    console.log('  - SQL Editor: https://supabase.com/dashboard/project/' + projectId + '/sql');
    console.log('  - Settings: https://supabase.com/dashboard/project/' + projectId + '/settings/general');
    console.log('');
  }
}

console.log('📝 Next Steps:');
console.log('');
console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
console.log('2. Check if you see any projects listed');
console.log('3. If the project "' + (supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] : 'N/A') + '" doesn\'t exist:');
console.log('   a. Either create a new project');
console.log('   b. Or select an existing project and update .env.local with its credentials');
console.log('');
console.log('4. To get credentials from a project:');
console.log('   - Go to: Settings > API');
console.log('   - Copy: Project URL, anon key, and service_role key');
console.log('   - Update .env.local with these values');
console.log('');
console.log('5. After updating, you can create an admin user via:');
console.log('   - Supabase Dashboard > Authentication > Users > Add user');
console.log('   - Or run: npm run create-admin');



