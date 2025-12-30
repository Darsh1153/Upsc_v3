// Script to auto-confirm all users in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  try {
    console.log('Fetching all users...');
    
    // Get all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error fetching users:', listError);
      return;
    }
    
    console.log(`Found ${users.length} users\n`);
    
    let confirmedCount = 0;
    let alreadyConfirmedCount = 0;
    
    for (const user of users) {
      if (!user.email_confirmed_at) {
        console.log(`Confirming: ${user.email}`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error(`  ✗ Error: ${updateError.message}`);
        } else {
          console.log(`  ✓ Confirmed`);
          confirmedCount++;
        }
      } else {
        console.log(`✓ Already confirmed: ${user.email}`);
        alreadyConfirmedCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total users: ${users.length}`);
    console.log(`Newly confirmed: ${confirmedCount}`);
    console.log(`Already confirmed: ${alreadyConfirmedCount}`);
    console.log(`\nAll users are now confirmed! You can login without email confirmation.`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

confirmAllUsers();

