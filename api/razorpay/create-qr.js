import { readJson, requireEnv, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { amount, bookingId } = await readJson(req);

    if (!amount || amount <= 0) {
      return sendJson(res, 400, { error: "A positive amount is required." });
    }

    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");

    // Amount must be in paise (smallest currency unit) — ₹1 = 100 paise
    const amountInPaise = Math.round(Number(amount) * 100);

    // Expire after 30 minutes
    const expireBy = Math.floor(Date.now() / 1000) + 30 * 60;

    const payload = JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      accept_partial: false,
      description: bookingId
        ? `Trust Rentals — Booking #${String(bookingId).slice(0, 8)}`
        : "Trust Rentals — Car Rental Payment",
      expire_by: expireBy,
      reference_id: bookingId || undefined,
      notify: {
        sms: false,
        email: false,
      },
      notes: {
        booking_id: bookingId || "",
        source: "trust-rentals",
      },
    });

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: payload,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay Payment Link creation failed:", data);
      return sendJson(res, 502, {
        error: data.error?.description || "Failed to create payment link.",
      });
    }

    // Generate QR code image from the payment link URL
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.short_url)}`;

    return sendJson(res, 200, {
      linkId: data.id,
      paymentUrl: data.short_url,
      qrImageUrl,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err) {
    console.error("create-qr error:", err);
    return sendJson(res, 500, { error: "Internal server error: " + err.message });
  }
}
