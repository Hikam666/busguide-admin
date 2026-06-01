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

async function inspectAll() {
  const tables = [
    'halte',
    'rute',
    'titik_rute',
    'po_bus',
    'bus',
    'wisata',
    'rute_wisata',
    'jadwal',
    'perjalanan',
    'profiles'
  ];

  for (const table of tables) {
    console.log(`\n=== Table: ${table} ===`);
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.error(`Error querying ${table}:`, error.message);
      } else {
        console.log(`Count: ${count}`);
        if (data && data.length > 0) {
          console.log(`First row:`, JSON.stringify(data[0], null, 2));
          console.log(`Data samples (up to 3):`, JSON.stringify(data.slice(0, 3), null, 2));
        } else {
          console.log(`Table is empty.`);
        }
      }
    } catch (e) {
      console.error(`Failed to query table ${table}:`, e);
    }
  }
}

inspectAll();
