import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanStuckBookings() {
  console.log("Cleaning up stuck pending_payment bookings...");
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('status', 'pending_payment')
    .is('razorpay_order_id', null);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Successfully deleted stuck bookings!");
  }
}

cleanStuckBookings();
