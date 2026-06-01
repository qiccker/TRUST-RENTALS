import { readJson, requireEnv, sendJson } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const { amount, bookingId, customerName, customerEmail, customerPhone } = await readJson(req);

    if (!amount || amount <= 0) {
      return sendJson(res, 400, { error: "A positive amount is required." });
    }

    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const amountInPaise = Math.round(Number(amount) * 100);

    // Step 1: Create a Customer in Razorpay
    let customerId;
    try {
      const custRes = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          name: customerName || "Guest",
          email: customerEmail || "guest@trustrentals.com",
          contact: customerPhone || undefined
        })
      });
      const custData = await custRes.json();
      if (!custRes.ok) {
        throw new Error(custData.error?.description || "Failed to create Razorpay customer.");
      }
      customerId = custData.id;
    } catch (err) {
      console.error("Error creating customer:", err);
      return sendJson(res, 502, { error: "Failed to create customer for QR Code." });
    }

    // Step 2: Create the UPI QR Code
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
        usage: "single_use",
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: bookingId ? `Booking #${String(bookingId).slice(0, 8)}` : "Car Rental Payment",
        customer_id: customerId,
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
      return sendJson(res, 502, {
        error: qrData.error?.description || "Failed to create UPI QR code.",
      });
    }

    // qrData.image_url is the Razorpay-hosted image of the UPI QR code!
    return sendJson(res, 200, {
      linkId: qrData.id,
      paymentUrl: qrData.image_url,
      qrImageUrl: qrData.image_url,
      amount: amountInPaise / 100, // Back to rupees
      currency: "INR",
    });
  } catch (err) {
    console.error("create-qr error:", err);
    return sendJson(res, 500, { error: "Internal server error: " + err.message });
  }
}
