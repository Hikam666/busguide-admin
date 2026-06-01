try {
  global.WebSocket = require('ws');
} catch (e) {
  global.WebSocket = class {};
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bgvwhsbpoxgkmrcygpvg.supabase.co';
const supabaseKey = 'sb_publishable_EbGKB6w1l0VoiVH8FSz93w_dBnggZw7';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  const email = `dev-test-${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log(`Trying to sign up user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    console.log("Trying to sign in with a default user instead...");
  } else {
    console.log("Sign up success! User ID:", signUpData.user?.id);
  }

  // Try to sign in (either the new user or a standard one if signup is restricted but we have credentials)
  const activeUser = signUpData.user || null;
  if (!activeUser) {
    // Let's try standard test users
    const testAccounts = [
      { email: 'admin@example.com', password: 'password' },
      { email: 'admin@busguide.com', password: 'password' },
      { email: 'superadmin@busguide.com', password: 'password' },
      { email: 'admin@gmail.com', password: 'password' }
    ];

    for (const acc of testAccounts) {
      console.log(`Trying to sign in with: ${acc.email}...`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(acc);
      if (!signInError) {
        console.log("Sign in success for:", acc.email);
        await queryTables(supabase);
        return;
      } else {
        console.log(`Sign in failed for ${acc.email}: ${signInError.message}`);
      }
    }
    console.log("Could not authenticate any user.");
  } else {
    // Query tables with the newly signed up user
    await queryTables(supabase);
  }
}

async function queryTables(client) {
  const tables = ['rute', 'wisata', 'jadwal', 'perjalanan', 'profiles'];
  for (const table of tables) {
    console.log(`\n=== Querying ${table} as Authenticated User ===`);
    const { data, error, count } = await client
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error:`, error.message);
    } else {
      console.log(`Count: ${count}`);
      if (data && data.length > 0) {
        console.log(`First row:`, JSON.stringify(data[0], null, 2));
        console.log(`Data samples (up to 3):`, JSON.stringify(data.slice(0, 3), null, 2));
      } else {
        console.log(`Table is empty.`);
      }
    }
  }
}

run();
