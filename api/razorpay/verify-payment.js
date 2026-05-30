import { createHmac } from "node:crypto";
import { readJson, requireEnv, sendJson } from "../_lib/http.js";
import { createSupabaseAdminClient } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await readJson(req);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, {
        error: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
      });
    }

    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");

    // Verify signature: HMAC SHA256 of "order_id|payment_id" with key_secret
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    const supabase = createSupabaseAdminClient();

    // Find the booking by razorpay_order_id
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (fetchError || !booking) {
      return sendJson(res, 404, { error: "Booking not found for this order." });
    }

    if (isValid) {
      // Payment verified — confirm the booking
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          razorpay_payment_id,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Failed to confirm booking:", updateError);
        return sendJson(res, 500, { error: "Failed to confirm booking." });
      }

      return sendJson(res, 200, { success: true, bookingId: booking.id });
    } else {
      // Signature mismatch — mark as payment_failed
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "payment_failed" })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Failed to update booking status:", updateError);
      }

      return sendJson(res, 400, { success: false, error: "Payment verification failed." });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return sendJson(res, 500, { error: "Internal server error." });
  }
}
