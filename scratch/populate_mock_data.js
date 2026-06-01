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

  console.log(`Signing up a temporary user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    return;
  }
  console.log("Sign up success! User ID:", signUpData.user?.id);

  console.log("\n1. Populating PO Bus details...");
  const poDetails = {
    "Akas": { jenis_layanan: "Antar Kota Jarak Jauh (AKAP)", fasilitas: "AC, WiFi, USB Charger, Reclining Seat", kontak: "0812-7788-9900" },
    "Arjuna": { jenis_layanan: "Pariwisata & Reguler", fasilitas: "AC, TV LCD, Audio System, WiFi", kontak: "0811-2233-4455" },
    "Damri": { jenis_layanan: "Pariwisata, Bandara & AKDP", fasilitas: "AC, WiFi, Charger Port", kontak: "1500-825" },
    "Tentrem": { jenis_layanan: "Patas & Executive", fasilitas: "AC, Toilet, Reclining Seat, USB Charger, Selimut", kontak: "0813-4455-6677" },
    "Lestari": { jenis_layanan: "Ekonomi & VIP", fasilitas: "AC, Charger Port, Toilet, Selimut", kontak: "0812-3344-5566" }
  };

  const { data: pos, error: poErr } = await supabase.from('po_bus').select('*');
  if (poErr) {
    console.error("Failed to fetch PO Bus:", poErr.message);
  } else {
    for (const po of pos) {
      const mock = poDetails[po.nama];
      if (mock) {
        console.log(`Updating PO Bus: ${po.nama}...`);
        const { error: updateErr } = await supabase
          .from('po_bus')
          .update(mock)
          .eq('id', po.id);
        if (updateErr) console.error(`Error updating ${po.nama}:`, updateErr.message);
        else console.log(`Successfully updated ${po.nama}`);
      }
    }
  }

  console.log("\n2. Populating Bus Names...");
  const { data: buses, error: busErr } = await supabase.from('bus').select('*');
  if (busErr) {
    console.error("Failed to fetch buses:", busErr.message);
  } else {
    // Generate some cool bus names
    const busNames = [
      "Jetbus 5 Voyager", "Jetbus 3+ Hino R260", "SR3 Panorama Hino",
      "Avante H8 Mercedes", "Legacy SR2 Prime", "Jetbus 5 Dream Coach",
      "Tentrem Maxima", "SR3 Suite Class", "Grand Turismo", "Mercedes Tourismo",
      "Hino Dutro Shuttler", "Avante H9 Dual Glass", "Jetbus 3+ SHD",
      "Legacy SR3 Ultimate", "Tentrem Avante H7"
    ];

    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const name = busNames[i % busNames.length];
      console.log(`Updating Bus ID ${bus.id} (${bus.nomor_polisi}) with name "${name}"...`);
      const { error: updateErr } = await supabase
        .from('bus')
        .update({ nama_bus: name })
        .eq('id', bus.id);
      if (updateErr) console.error(`Error updating bus ${bus.nomor_polisi}:`, updateErr.message);
      else console.log(`Successfully updated bus ${bus.nomor_polisi}`);
    }
  }

  console.log("\n3. Populating Halte / Terminal Photos & Facilities...");
  const { data: haltes, error: halteErr } = await supabase.from('halte').select('*');
  if (halteErr) {
    console.error("Failed to fetch haltes:", halteErr.message);
  } else {
    const haltePhotos = [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80", // Bus station
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80", // Bus halt
      "https://images.unsplash.com/photo-1562601579-579bc068a3bd?auto=format&fit=crop&w=600&q=80"  // Bus terminal
    ];

    const facilitiesOptions = [
      "AC, Ruang Tunggu",
      "WiFi, Charger Port",
      "AC, WiFi, Toilet, Mushola",
      "AC, Ruang Tunggu, Toilet",
      "Ruang Tunggu, Toko Retail"
    ];

    for (let i = 0; i < haltes.length; i++) {
      const h = haltes[i];
      const photo = haltePhotos[i % haltePhotos.length];
      const facilities = facilitiesOptions[i % facilitiesOptions.length];
      console.log(`Updating Halte "${h.nama}" with photo and facilities...`);
      const { error: updateErr } = await supabase
        .from('halte')
        .update({ foto: photo, fasilitas: facilities })
        .eq('id', h.id);
      if (updateErr) console.error(`Error updating halte ${h.nama}:`, updateErr.message);
      else console.log(`Successfully updated halte ${h.nama}`);
    }
  }

  console.log("\n4. Populating Jadwal Intervals & Tarifs...");
  const { data: jadwals, error: jadwalErr } = await supabase.from('jadwal').select('*');
  if (jadwalErr) {
    console.error("Failed to fetch jadwals:", jadwalErr.message);
  } else {
    const intervals = [15, 20, 30, 45, 60];
    const tarifs = [12000, 15000, 20000, 25000, 35000, 50000];

    for (let i = 0; i < jadwals.length; i++) {
      const j = jadwals[i];
      const interval = intervals[i % intervals.length];
      const tarif = tarifs[i % tarifs.length];
      console.log(`Updating Jadwal ID ${j.id} with interval ${interval}m and tarif Rp ${tarif}...`);
      const { error: updateErr } = await supabase
        .from('jadwal')
        .update({ interval: interval, tarif: tarif })
        .eq('id', j.id);
      if (updateErr) console.error(`Error updating jadwal ${j.id}:`, updateErr.message);
      else console.log(`Successfully updated jadwal ${j.id}`);
    }
  }

  console.log("\nPopulate done.");
}

run();
