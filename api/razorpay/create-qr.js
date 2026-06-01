import { readJson, requireEnv, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  try {
    const { amount, bookingId } = await readJson(req);
    if (!amount || amount <= 0) return sendJson(res, 400, { error: "Amount required" });

    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    
    const amountInPaise = Math.round(Number(amount) * 100);
    const expireBy = Math.floor(Date.now() / 1000) + 30 * 60; // 30 mins

    const qrRes = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        type: "upi_qr",
        name: "Trust Rentals",
        usage: "multiple_use", // Bypass customer_id requirement completely!
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: bookingId ? `Booking #${String(bookingId).slice(0, 8)}` : "Car Rental Payment",
        close_by: expireBy,
        notes: {
          booking_id: bookingId || "",
          source: "trust-rentals",
        },
      }),
    });

    const qrData = await qrRes.json();

    if (!qrRes.ok) {
      console.error("Razorpay QR creation failed:", qrData);
      return sendJson(res, 502, { error: qrData.error?.description || "Failed to create UPI QR code." });
    }

    return sendJson(res, 200, {
      linkId: qrData.id,
      qrImageUrl: qrData.image_url,
      amount: amountInPaise / 100, // Back to rupees
      currency: "INR",
    });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
