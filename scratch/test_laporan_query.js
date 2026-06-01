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
  console.log("Signing in...");
  const email = `dev-test-${Date.now()}@example.com`;
  const password = 'Password123!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
  }

  console.log("=== Querying perjalanan with joins ===");
  const { data, error } = await supabase
    .from('perjalanan')
    .select(`
      *,
      rute:rute!id_rute (nama, estimasi_menit),
      halte_asal:halte!halte_asal (nama, latitude, longitude),
      halte_tujuan:halte!halte_tujuan (nama, latitude, longitude),
      profil:profiles!id_pengguna (nama, email)
    `)
    .limit(1);

  if (error) {
    console.error("Query failed with error:", error.message, "(code:", error.code, ")");
  } else {
    console.log("Query success! Data:", data);
  }
}

run();
