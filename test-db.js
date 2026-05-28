import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  // Let's just login with a dummy user or just check cars to ensure connection works
  const { data: cars, error: carsError } = await supabase.from('cars').select('id, name').limit(1);
  console.log('Cars:', cars, carsError);

  // We can't select bookings because of RLS for anon.
}
check();
