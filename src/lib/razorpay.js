/**
 * Opens the Razorpay checkout modal and returns a promise
 * that resolves with the payment response or rejects on dismissal/error.
 */
export function openRazorpayCheckout({
  orderId,
  amount,
  currency,
  keyId,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
}) {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === "undefined") {
      reject(new Error("Razorpay SDK not loaded. Please refresh the page and try again."));
      return;
    }

    const options = {
      key: keyId,
      amount,
      currency,
      name: "TRUST RENTALS",
      description: `Booking #${bookingId.slice(0, 8)}`,
      order_id: orderId,
      prefill: {
        name: customerName || "",
        email: customerEmail || "",
        contact: customerPhone || "",
      },
      theme: {
        color: "#0d9488", // teal-600 to match the site's brand
      },
      modal: {
        ondismiss() {
          reject(new Error("Payment cancelled by user."));
        },
        confirm_close: true,
        escape: true,
      },
      handler(response) {
        // Called on successful payment
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed. Please try again."));
    });

    rzp.open();
  });
}
