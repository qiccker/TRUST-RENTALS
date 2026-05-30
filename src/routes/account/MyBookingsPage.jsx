import { CalendarDays, CarFront, ReceiptText, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useBookings } from "../../hooks/useBookings";
import { formatDisplayDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
function MyBookingsPage() {
  const { user } = useAuth();
  const { bookings, updateBookingStatus } = useBookings();
  const visibleBookings = bookings.filter((booking) => booking.userId === user?.id || user?.role === "admin");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink">My bookings</h1>
        </div>
        <Link to="/fleet">
          <Button leftIcon={<CarFront className="h-4 w-4" aria-hidden="true" />}>Book another car</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {visibleBookings.map((booking) => (
          <article key={booking.id} className="rounded-md border border-line bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-ink">{booking.carName}</h2>
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-bold capitalize ${booking.status === "confirmed" ? "bg-basil/10 text-basil" : booking.status === "cancelled" ? "bg-ember/10 text-ember" : "bg-saffron/15 text-ink"}`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-graphite sm:grid-cols-3">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-teal" aria-hidden="true" />
                    {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ReceiptText className="h-4 w-4 text-teal" aria-hidden="true" />
                    {formatMoney(booking.totalPrice)}
                  </span>
                  <span>{booking.customerEmail}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {booking.status === "confirmed" ? (
                  <Link to={`/receipt/${booking.id}`}>
                    <Button
                      variant="secondary"
                      className="w-full"
                      leftIcon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}
                    >
                      Receipt
                    </Button>
                  </Link>
                ) : null}
                
                {booking.status !== "cancelled" ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => updateBookingStatus(booking.id, "cancelled")}
                    leftIcon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {visibleBookings.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-8 text-center">
            <p className="text-lg font-bold text-ink">No bookings yet.</p>
            <Link to="/fleet" className="mt-4 inline-block">
              <Button>Browse fleet</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
export {
  MyBookingsPage
};
