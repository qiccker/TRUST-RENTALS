import { readJson, requireEnv, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { linkId, bookingId } = await readJson(req);

    if (!linkId) {
      return sendJson(res, 400, { error: "linkId is required." });
    }

    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Check QR code status from Razorpay
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/qr_codes/${linkId}`,
      {
        headers: { Authorization: `Basic ${credentials}` },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay QR check failed:", data);
      return sendJson(res, 502, { error: "Failed to check payment status." });
    }

    const paid = data.payments_amount_received >= data.payment_amount;
    let paymentId = paid ? linkId : null; // Use QR ID as payment reference

    if (paid && bookingId && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== "YOUR_SERVICE_ROLE_KEY") {
      try {
        const { createSupabaseAdminClient } = await import("../_lib/supabase.js");
        const supabase = createSupabaseAdminClient();
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            razorpay_payment_id: paymentId,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      } catch (dbErr) {
        console.error("Failed to confirm booking in DB:", dbErr);
        // Non-fatal — we still return paid=true so user sees success
      }
    }

    return sendJson(res, 200, {
      paid,
      paymentId,
      status: paid ? "paid" : "pending",
      amountReceived: data.payments_amount_received,
    });
  } catch (err) {
    console.error("check-payment error:", err);
    return sendJson(res, 500, { error: "Internal server error: " + err.message });
  }
}
