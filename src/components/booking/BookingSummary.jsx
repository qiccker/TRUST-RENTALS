import { CalendarDays, CarFront, CreditCard, ShieldCheck } from "lucide-react";
import { formatDisplayDate, rentalDays } from "../../lib/dates";
import { formatMoney } from "../../lib/money";
function BookingSummary({ car, startDate, endDate }) {
  const days = rentalDays(startDate, endDate);
  const subtotal = days * car.pricePerDay;
  return <aside className="grid gap-5 rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <img className="h-20 w-24 rounded-md object-cover" src={car.images[0]} alt={car.name} />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">Booking summary</p>
          <h2 className="text-xl font-black text-ink">{car.name}</h2>
          <p className="text-sm text-graphite">{car.seats} seats • {car.fuelType}</p>
        </div>
      </div>

      <div className="grid gap-3 border-y border-line py-4 text-sm">
        <span className="inline-flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-graphite">
            <CalendarDays className="h-4 w-4 text-teal" aria-hidden="true" />
            Pickup
          </span>
          <strong>{formatDisplayDate(startDate)}</strong>
        </span>
        <span className="inline-flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-graphite">
            <CarFront className="h-4 w-4 text-teal" aria-hidden="true" />
            Return
          </span>
          <strong>{formatDisplayDate(endDate)}</strong>
        </span>
      </div>

      <div className="grid gap-2 text-sm">
        <span className="flex justify-between">
          <span>{days || 0} rental days</span>
          <strong>{formatMoney(subtotal)}</strong>
        </span>
        <span className="mt-2 flex justify-between border-t border-line pt-3 text-lg font-black">
          <span>Total</span>
          <span>{formatMoney(subtotal)}</span>
        </span>
      </div>

      <div className="grid gap-2 rounded-md bg-mist p-4 text-sm text-graphite">
        <span className="inline-flex items-center gap-2 font-bold text-ink">
          <ShieldCheck className="h-4 w-4 text-basil" aria-hidden="true" />
          Protected checkout
        </span>
        <span className="inline-flex items-center gap-2">
          The booking is confirmed after payment succeeds.
        </span>
      </div>
    </aside>;
}
export {
  BookingSummary
};
