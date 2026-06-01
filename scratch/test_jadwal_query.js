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

  console.log("=== Querying jadwal with joins ===");
  const { data, error } = await supabase
    .from('jadwal')
    .select(`
      *,
      rute:rute!id_rute (nama, kode),
      bus:bus!id_bus (
        nomor_polisi,
        tipe,
        id_po,
        po_bus (nama, logo_url)
      )
    `)
    .limit(1);

  if (error) {
    console.error("Query failed with error:", error.message, "(code:", error.code, ")");
  } else {
    console.log("Query success! Data:", data);
  }
}

run();
