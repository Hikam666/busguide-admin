const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function checkSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`);
  if (res.status === 200) {
    const data = await res.json();
    const notifikasiDef = data.definitions.notifikasi;
    console.log("Notifikasi schema:", notifikasiDef ? notifikasiDef.properties : "Table not found");
  } else {
    console.log("Error fetching spec:", await res.text());
  }
}
checkSchema();
