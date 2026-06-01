import { readJson, requireEnv, sendJson } from "../_lib/http.js";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } = await readJson(req);
    
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return sendJson(res, 400, { error: "Invalid payment signature" });
    }

    // Update DB
    if (bookingId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createSupabaseAdminClient } = await import("../_lib/supabase.js");
        const supabase = createSupabaseAdminClient();
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            razorpay_payment_id: razorpay_payment_id,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      } catch (err) {
        console.error("DB error:", err);
      }
    }

    return sendJson(res, 200, { success: true });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
