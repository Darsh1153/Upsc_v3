// Script to reset admin user password
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables!');
    console.error('Make sure .env.local exists with:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetAdminPassword() {
    try {
        const email = process.argv[2] || 'admin@upscprep.com';
        const newPassword = process.argv[3] || 'admin123';

        console.log('Resetting password for:', email);
        console.log('New password:', '*'.repeat(newPassword.length));
        console.log('');

        // Get all users to find the admin
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Error fetching users:', listError.message);
            process.exit(1);
        }

        const adminUser = users.find(u => u.email === email);

        if (!adminUser) {
            console.error('❌ User not found:', email);
            console.log('\nAvailable users:');
            users.forEach(u => console.log('  -', u.email));
            process.exit(1);
        }

        console.log('Found user:', adminUser.email, '(ID:', adminUser.id, ')');

        // Update the password
        const { data, error } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            {
                password: newPassword,
                email_confirm: true // Ensure email is confirmed
            }
        );

        if (error) {
            console.error('❌ Error updating password:', error.message);
            process.exit(1);
        }

        console.log('✅ Password reset successfully!\n');
        console.log('📝 New Login Credentials:');
        console.log('  Email:', email);
        console.log('  Password:', newPassword);
        console.log('\n🚀 You can now login at your deployed site or http://localhost:3000');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

resetAdminPassword();
