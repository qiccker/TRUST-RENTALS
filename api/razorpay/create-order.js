import { createHmac } from "node:crypto";
import { readJson, requireEnv, sendJson } from "../_lib/http.js";
import { createSupabaseAdminClient, getAuthenticatedUser } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return sendJson(res, 401, { error: authError || "Unauthorized." });
    }

    const { bookingId, amount } = await readJson(req);

    if (!bookingId || !amount || amount <= 0) {
      return sendJson(res, 400, { error: "bookingId and a positive amount are required." });
    }

    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");

    // Verify booking exists and belongs to the user
    const supabase = createSupabaseAdminClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, status, total_price")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return sendJson(res, 404, { error: "Booking not found." });
    }

    if (booking.user_id !== user.id) {
      return sendJson(res, 403, { error: "You can only pay for your own bookings." });
    }

    if (booking.status !== "pending_payment") {
      return sendJson(res, 400, { error: `Booking is already ${booking.status}.` });
    }

    // Create Razorpay order
    // Amount must be in paise (smallest currency unit) – ₹1 = 100 paise
    const amountInPaise = Math.round(Number(booking.total_price) * 100);

    const orderPayload = JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt: bookingId,
      notes: {
        booking_id: bookingId,
        user_id: user.id,
      },
    });

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: orderPayload,
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("Razorpay order creation failed:", orderData);
      return sendJson(res, 502, { error: "Failed to create payment order." });
    }

    // Store razorpay_order_id on the booking
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ razorpay_order_id: orderData.id })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to store order ID:", updateError);
      // Non-fatal — payment can still proceed
    }

    return sendJson(res, 200, {
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return sendJson(res, 500, { error: "Internal server error: " + err.message });
  }
}
