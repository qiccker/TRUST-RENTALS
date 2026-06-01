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

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: bookingId ? String(bookingId).slice(0, 40) : "receipt_1",
      }),
    });
    
    const data = await response.json();
    if (!response.ok) return sendJson(res, 502, { error: data.error?.description || "Failed to create order" });

    return sendJson(res, 200, { orderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
