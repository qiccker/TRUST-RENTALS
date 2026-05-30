import { CreditCard, LockKeyhole, QrCode, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookingSummary } from "../../components/booking/BookingSummary";
import { CustomerInfoForm } from "../../components/booking/CustomerInfoForm";
import { DateRangePicker } from "../../components/booking/DateRangePicker";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useBookings } from "../../hooks/useBookings";
import { formatMoney } from "../../lib/money";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/browser";
import { validateBookingRange } from "../../lib/validation/booking";

function BookingPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const navigate = useNavigate();
  const location = useLocation();

  const [car, setCar] = useState(null);
  const [isLoadingCar, setIsLoadingCar] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customer, setCustomer] = useState({
    customerName: user?.fullName ?? "",
    customerEmail: user?.email ?? "",
    customerPhone: user?.phone ?? ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code payment state
  const [qrData, setQrData] = useState(null);
  const pollIntervalRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  // Fetch car by slug
  useEffect(() => {
    async function loadCar() {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoadingCar(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("cars")
          .select(`*, car_images (id, url, storage_path, is_primary, sort_order)`)
          .eq("slug", slug)
          .single();
        if (error) throw error;
        // Fetch existing bookings to block dates
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("start_date, end_date")
          .eq("car_id", data.id)
          .not("status", "in", '("cancelled","payment_failed")');

        const bookedRanges = (bookingsData || []).map(b => ({
          startDate: b.start_date,
          endDate: b.end_date
        }));

        setCar({
          ...data,
          pricePerDay: Number(data.price_per_day),
          fuelType: data.fuel_type,
          luggageCapacity: data.luggage_capacity,
          isAvailable: data.is_available,
          images: data.car_images
            ? data.car_images.sort((a, b) => a.sort_order - b.sort_order).map((img) => img.url)
            : [],
          bookedRanges
        });
      } catch (err) {
        console.error("Error loading car for booking:", err);
        setCar(null);
      } finally {
        setIsLoadingCar(false);
      }
    }
    loadCar();
  }, [slug]);

  // Poll for QR code payment
  useEffect(() => {
    if (!qrData) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/razorpay/check-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId: qrData.linkId,
            bookingId: qrData.bookingId,
          }),
        });
        const data = await res.json();

        if (data.paid) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          navigate(`/success?booking=${qrData.bookingId}`);
        }
      } catch (err) {
        console.error("Payment check error:", err);
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [qrData, navigate]);

  const validation = useMemo(
    () => car ? validateBookingRange(car, startDate, endDate) : { ok: false, message: "Car not found." },
    [car, endDate, startDate]
  );

  if (isLoadingCar) {
    return (
      <section className="bg-mist py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
      </section>
    );
  }

  if (!car) {
    return <Navigate to="/fleet" replace />;
  }

  if (!user) {
    return <section className="bg-mist py-16">
        <div className="mx-auto max-w-xl rounded-md border border-line bg-white p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto h-10 w-10 text-teal" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-black text-ink">Sign in to book</h1>
          <p className="mt-3 text-sm leading-6 text-graphite">
            Customer accounts keep booking history, payment receipts, and cancellation status tied to the right person.
          </p>
          <Link to="/login" state={{ from: location.pathname }} className="mt-6 inline-block">
            <Button>Sign in</Button>
          </Link>
        </div>
      </section>;
  }

  /** Admin/staff flow — direct booking without payment gateway */
  async function handleAdminSubmit(event, bookingStatus) {
    if (event) event.preventDefault();
    setError("");
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (!customer.customerName.trim() || !customer.customerEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    setIsSubmitting(true);
    const draft = {
      car,
      userId: user.id,
      startDate,
      endDate,
      customerName: customer.customerName.trim(),
      customerEmail: customer.customerEmail.trim(),
      customerPhone: customer.customerPhone.trim(),
      totalPrice: validation.totalPrice
    };
    try {
      const booking = await createBooking(draft, bookingStatus);
      navigate(`/success?booking=${booking.id}`);
    } catch (err) {
      setError(err.message || "Failed to create booking. Please try again.");
      setIsSubmitting(false);
    }
  }

  /** Customer flow — create booking then show Razorpay QR code */
  async function handlePayNow(event) {
    if (event) event.preventDefault();
    setError("");
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    if (!customer.customerName.trim() || !customer.customerEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    setIsSubmitting(true);

    let createdBookingId = null;
    try {
      // Step 1: Create booking with pending_payment status
      const draft = {
        car,
        userId: user.id,
        startDate,
        endDate,
        customerName: customer.customerName.trim(),
        customerEmail: customer.customerEmail.trim(),
        customerPhone: customer.customerPhone.trim(),
        totalPrice: validation.totalPrice
      };
      const booking = await createBooking(draft, "pending_payment");
      createdBookingId = booking.id;

      // Step 2: Get QR code from our API
      const qrRes = await fetch("/api/razorpay/create-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: validation.totalPrice,
        }),
      });

      const qrResult = await qrRes.json();

      if (!qrRes.ok) {
        throw new Error(qrResult.error || "Failed to generate payment QR code.");
      }

      // Step 3: Show QR code — polling starts via useEffect
      setQrData({
        linkId: qrResult.linkId,
        imageUrl: qrResult.qrImageUrl,
        amount: validation.totalPrice,
        bookingId: booking.id,
      });
      setIsSubmitting(false);
    } catch (err) {
      if (createdBookingId) {
        // Rollback booking to free up dates
        await supabase
          .from("bookings")
          .update({ status: "payment_failed" })
          .eq("id", createdBookingId);
      }
      setError(err.message || "Payment failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  /** Cancel the QR payment and rollback booking */
  function handleCancelPayment() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (qrData?.bookingId) {
      supabase
        .from("bookings")
        .update({ status: "payment_failed" })
        .eq("id", qrData.bookingId)
        .then(() => {});
    }
    setQrData(null);
    setError("Payment was cancelled. You can try again.");
  }

  // ── QR Code Payment Screen ────────────────────────────────────
  if (qrData) {
    return (
      <section className="bg-mist py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div className="rounded-md border border-line bg-white p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Payment</p>
              <h1 className="mt-2 text-3xl font-black text-ink">Scan & Pay</h1>
              <p className="mt-2 text-sm text-graphite max-w-md mx-auto">
                Open any UPI app (Google Pay, PhonePe, Paytm, etc.) and scan the QR code below to complete your payment.
              </p>
            </div>

            {/* QR Code */}
            <div className="mx-auto w-fit">
              <div className="rounded-2xl border-2 border-teal/20 bg-gradient-to-b from-teal/5 to-white p-6 shadow-sm">
                <img
                  src={qrData.imageUrl}
                  alt="Payment QR Code — Scan with any UPI app"
                  className="mx-auto h-64 w-64 rounded-md"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="mt-6 text-center">
              <p className="text-4xl font-black text-ink">{formatMoney(qrData.amount)}</p>
              <p className="mt-1 text-sm text-graphite">Total amount to pay</p>
            </div>

            {/* Waiting indicator */}
            <div className="mt-8 flex items-center justify-center gap-3 rounded-md bg-teal/5 border border-teal/10 px-4 py-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
              </span>
              <span className="text-sm font-semibold text-teal">
                Waiting for payment confirmation...
              </span>
            </div>

            {/* UPI apps row */}
            <div className="mt-6 text-center">
              <p className="text-xs text-graphite">
                Supported UPI apps: Google Pay • PhonePe • Paytm • BHIM • Any UPI app
              </p>
            </div>

            {/* Cancel */}
            <div className="mt-6 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ember hover:underline transition"
                onClick={handleCancelPayment}
              >
                <XCircle className="h-4 w-4" />
                Cancel payment
              </button>
            </div>
          </div>

          <BookingSummary car={car} startDate={startDate} endDate={endDate} />
        </div>
      </section>
    );
  }

  // ── Booking Form Screen ───────────────────────────────────────
  return <section className="bg-mist py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <form className="grid gap-6 rounded-md border border-line bg-white p-6 shadow-sm" onSubmit={isAdmin ? (e) => handleAdminSubmit(e, "pending_payment") : handlePayNow}>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Online booking</p>
              <h1 className="mt-2 text-4xl font-black text-ink">Reserve {car.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite">
              {isAdmin
                ? "Choose dates, confirm driver contact details, and secure the reservation."
                : "Choose dates, confirm your details, and pay via UPI QR code to lock in your reservation."}
            </p>
          </div>

          <section className="grid gap-4">
            <h2 className="text-xl font-black text-ink">Dates</h2>
            <DateRangePicker 
              startDate={startDate} 
              endDate={endDate} 
              bookedRanges={car.bookedRanges}
              onChange={(value) => {
                setStartDate(value.startDate);
                setEndDate(value.endDate);
              }} 
            />
            {!validation.ok && startDate && endDate ? <p className="inline-flex items-center gap-2 rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                {validation.message}
              </p> : null}
          </section>

          <section className="grid gap-4">
            <h2 className="text-xl font-black text-ink">Customer</h2>
            <CustomerInfoForm value={customer} onChange={setCustomer} />
          </section>

          {user?.documentStatus !== "verified" && (
            <div className="rounded-md bg-saffron/10 p-4 border border-saffron/20">
              <p className="text-sm font-semibold text-ink flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-saffron" />
                Profile Verification Required
              </p>
              <p className="mt-1 text-xs text-graphite">
                You must complete your profile by uploading your ID and Driving License before you can book a vehicle. 
                Current status: <strong className="capitalize">{user?.documentStatus || "unsubmitted"}</strong>
              </p>
              <Link to="/account/profile" className="mt-3 inline-block">
                <Button variant="secondary" className="h-8 text-xs">
                  Go to My Profile
                </Button>
              </Link>
            </div>
          )}

          {error ? <p className="rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {isAdmin ? (
              <>
                <p className="text-sm text-graphite">
                  Admin/staff: booking will be created with the selected status.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={isSubmitting}
                    disabled={!validation.ok || user?.documentStatus !== "verified"}
                    onClick={() => handleAdminSubmit(null, "confirmed")}
                  >
                    Approve (Paid)
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={!validation.ok || user?.documentStatus !== "verified"}
                  >
                    Reserve (Pending)
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="inline-flex items-center gap-2 text-sm text-graphite">
                  <ShieldCheck className="h-4 w-4 text-basil" aria-hidden="true" />
                  Secure UPI payment via Razorpay
                </p>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!validation.ok || user?.documentStatus !== "verified"}
                  leftIcon={<QrCode className="h-4 w-4" aria-hidden="true" />}
                >
                  {validation.ok ? `Pay ${formatMoney(validation.totalPrice)} via UPI` : "Pay via UPI"}
                </Button>
              </>
            )}
          </div>
        </form>

        <BookingSummary car={car} startDate={startDate} endDate={endDate} />
      </div>
    </section>;
}
export {
  BookingPage
};
