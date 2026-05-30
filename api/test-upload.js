import { createClient } from "@supabase/supabase-js";
import { readJson, sendJson } from "../_lib/http.js";
import fs from "fs";

export default async function handler(req, res) {
  try {
    // Read .env manually
    const envFile = fs.readFileSync(".env", "utf-8");
    const envVars = {};
    envFile.split("\n").forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) envVars[match[1].trim()] = match[2].trim();
    });

    const SUPABASE_URL = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
    const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

    // Simulate the frontend client (anon key + user auth)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Login as admin
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: "admin@trustrentals.com",
      password: "adminpassword" // assuming this is a standard test admin
    });
    
    if (authErr) return sendJson(res, 500, { step: "auth", error: authErr });

    // Test storage upload
    const fileName = `test/${Date.now()}.txt`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("car-images")
      .upload(fileName, "test content");

    if (uploadErr) return sendJson(res, 500, { step: "storage", error: uploadErr });

    // Try car_images insert (we need a valid car_id)
    const { data: carData } = await supabase.from("cars").select("id").limit(1).single();
    if (!carData) return sendJson(res, 500, { step: "find_car", error: "No cars" });

    const { error: dbErr } = await supabase.from("car_images").insert({
      car_id: carData.id,
      url: "test",
      storage_path: fileName,
      is_primary: false,
      sort_order: 100
    });

    if (dbErr) return sendJson(res, 500, { step: "db_insert", error: dbErr });

    // Clean up
    await supabase.storage.from("car-images").remove([fileName]);

    return sendJson(res, 200, { success: true });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
