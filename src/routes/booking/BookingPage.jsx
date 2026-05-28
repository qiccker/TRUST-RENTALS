import { CreditCard, LockKeyhole, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookingSummary } from "../../components/booking/BookingSummary";
import { CustomerInfoForm } from "../../components/booking/CustomerInfoForm";
import { DateRangePicker } from "../../components/booking/DateRangePicker";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useBookings } from "../../hooks/useBookings";
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

  async function handleSubmit(event) {
    event.preventDefault();
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
      const accessToken = supabase ? (await supabase.auth.getSession()).data.session?.access_token : void 0;
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        },
        body: JSON.stringify({
          carId: car.id,
          startDate,
          endDate,
          customerName: draft.customerName,
          customerEmail: draft.customerEmail,
          customerPhone: draft.customerPhone
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
    }
    const booking = createBooking(draft, "confirmed");
    navigate(`/success?booking=${booking.id}`);
  }

  return <section className="bg-mist py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <form className="grid gap-6 rounded-md border border-line bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Online booking</p>
              <h1 className="mt-2 text-4xl font-black text-ink">Reserve {car.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite">
              Choose dates, confirm driver contact details, and continue to protected checkout.
            </p>
          </div>

          <section className="grid gap-4">
            <h2 className="text-xl font-black text-ink">Dates</h2>
            <DateRangePicker startDate={startDate} endDate={endDate} onChange={(value) => {
    setStartDate(value.startDate);
    setEndDate(value.endDate);
  }} />
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
            <p className="text-sm text-graphite">
              Checkout creates a 30-minute hold before payment confirmation.
            </p>
            <Button
    type="submit"
    isLoading={isSubmitting}
    disabled={!validation.ok || user?.documentStatus !== "verified"}
    leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
  >
              Checkout
            </Button>
          </div>
        </form>

        <BookingSummary car={car} startDate={startDate} endDate={endDate} />
      </div>
    </section>;
}
export {
  BookingPage
};
