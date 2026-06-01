import https from "https";

const keyId = "rzp_test_SvbmL3z3WoIduz";
const keySecret = "8mOmB1UjMIKYOao3ds9rOQCJ";
const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

async function run() {
  const payload = JSON.stringify({
    type: "upi_qr",
    name: "Trust Rentals",
    usage: "single_use",
    fixed_amount: true,
    payment_amount: 100, // 1 INR
    description: "Test",
    close_by: Math.floor(Date.now() / 1000) + 30 * 60,
    notes: { test: "test" }
  });

  const req = https.request({
    hostname: "api.razorpay.com",
    port: 443,
    path: "/v1/payments/qr_codes",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log("Status:", res.statusCode, "Response:", data));
  });

  req.on('error', console.error);
  req.write(payload);
  req.end();
}

run();
