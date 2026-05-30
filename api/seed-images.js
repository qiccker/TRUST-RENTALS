import fs from "fs";
import { createSupabaseAdminClient } from "../_lib/supabase.js";
import { sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Fetch all cars
    const { data: cars, error: carsErr } = await supabase.from("cars").select("id, type");
    if (carsErr) throw carsErr;

    const paths = {
      sedan: "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\737ef0a7-8209-4f73-b6b6-afba59328a40\\luxury_sedan_1780159626032.png",
      suv: "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\737ef0a7-8209-4f73-b6b6-afba59328a40\\modern_suv_1780159650323.png",
      sports: "C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\737ef0a7-8209-4f73-b6b6-afba59328a40\\sports_car_1780159672842.png",
    };

    let count = 0;

    for (const car of cars) {
      // Pick image based on type or fallback to sedan
      let imgPath = paths.sedan;
      if (car.type === "suv") imgPath = paths.suv;
      if (car.type === "sports" || car.type === "convertible" || car.type === "coupe") imgPath = paths.sports;

      if (!fs.existsSync(imgPath)) continue;
      
      const fileBuffer = fs.readFileSync(imgPath);
      const fileName = `${car.id}/${Date.now()}.png`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(fileName, fileBuffer, { contentType: "image/png" });
        
      if (uploadError) {
        console.error("Upload error for car", car.id, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("car-images").getPublicUrl(fileName);

      // Insert into car_images
      await supabase.from("car_images").insert({
        car_id: car.id,
        url: publicUrl,
        storage_path: fileName,
        is_primary: true,
        sort_order: 0
      });
      
      count++;
    }

    return sendJson(res, 200, { success: true, uploaded: count });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err.message });
  }
}
