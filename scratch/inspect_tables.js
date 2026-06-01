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

async function inspect() {
  console.log("=== Inspecting 'perjalanan' columns ===");
  const { data: pData, error: pErr } = await supabase.from('perjalanan').select('*').limit(1);
  if (pErr) console.error("perjalanan error:", pErr);
  else console.log("perjalanan row sample:", pData);

  console.log("=== Inspecting 'wisata' columns ===");
  const { data: wData, error: wErr } = await supabase.from('wisata').select('*').limit(1);
  if (wErr) console.error("wisata error:", wErr);
  else console.log("wisata row sample:", wData);

  console.log("=== Inspecting 'titik_rute' columns ===");
  const { data: tData, error: tErr } = await supabase.from('titik_rute').select('*').limit(1);
  if (tErr) console.error("titik_rute error:", tErr);
  else console.log("titik_rute row sample:", tData);
}

inspect();
