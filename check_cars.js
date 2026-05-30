import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Use environment variables (using dotenv is not always available, so we'll read .env manually if needed, 
// or just use process.env if loaded via node --env-file)
const envFile = fs.readFileSync(".env", "utf8");
let url = "";
let key = "";
envFile.split("\n").forEach(line => {
  if (line.startsWith("VITE_SUPABASE_URL=")) url = line.split("=")[1].trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) key = line.split("=")[1].trim();
});

if (!url || !key) {
  console.log("Missing URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from("cars").select("*, car_images(*)");
  console.log(JSON.stringify(data, null, 2));
}

check();
