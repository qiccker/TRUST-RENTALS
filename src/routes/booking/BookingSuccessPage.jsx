import { CheckCircle2, ReceiptText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useBookings } from "../../hooks/useBookings";
import { formatDisplayDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
function BookingSuccessPage() {
  const [params] = useSearchParams();
  const { bookings } = useBookings();
  const booking = bookings.find((item) => item.id === params.get("booking"));
  return <section className="bg-mist py-16">
      <div className="mx-auto max-w-2xl rounded-md border border-line bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-basil" aria-hidden="true" />
        <h1 className="mt-4 text-4xl font-black text-ink">Booking confirmed</h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          Your reservation is now in your account. A receipt will be sent after live payment confirmation.
        </p>

        {booking ? <div className="mt-8 grid gap-3 rounded-md bg-mist p-5 text-left text-sm">
            <span className="flex justify-between">
              <span className="text-graphite">Vehicle</span>
              <strong>{booking.carName}</strong>
            </span>
            <span className="flex justify-between">
              <span className="text-graphite">Dates</span>
              <strong>
                {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
              </strong>
            </span>
            <span className="flex justify-between">
              <span className="text-graphite">Total</span>
              <strong>{formatMoney(booking.totalPrice)}</strong>
            </span>
          </div> : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account/bookings">
            <Button leftIcon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}>View bookings</Button>
          </Link>
          <Link to="/fleet">
            <Button variant="secondary">Browse more cars</Button>
          </Link>
        </div>
      </div>
    </section>;
}
export {
  BookingSuccessPage
};
