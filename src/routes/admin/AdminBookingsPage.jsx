import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { useBookings } from "../../hooks/useBookings";
import { formatDisplayDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";

function AdminBookingsPage() {
  const { bookings, fetchBookings, updateBookingStatus } = useBookings();
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  return <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Booking control</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Bookings</h1>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => <article key={booking.id} className="rounded-md border border-line bg-white p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-ink">{booking.carName}</h2>
                  <span className="rounded-md bg-mist px-3 py-1 text-xs font-bold capitalize text-graphite">
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-graphite md:grid-cols-4">
                  <span>{booking.customerName}</span>
                  <span>{booking.customerEmail}</span>
                  <span>
                    {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                  </span>
                  <strong className="text-ink">{formatMoney(booking.totalPrice)}</strong>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
    variant="secondary"
    onClick={() => updateBookingStatus(booking.id, "confirmed")}
    leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
  >
                  Confirm
                </Button>
                <Button
    variant="danger"
    onClick={() => updateBookingStatus(booking.id, "cancelled")}
    leftIcon={<XCircle className="h-4 w-4" aria-hidden="true" />}
  >
                  Cancel
                </Button>
              </div>
            </div>
          </article>)}
      </div>
    </div>;
}
export {
  AdminBookingsPage
};
