import { format } from "date-fns";
import { Check, Clock, X } from "lucide-react";
import { formatShortDay, upcomingDays } from "../../lib/dates";
function AvailabilityCalendar({ car }) {
  const days = upcomingDays(21);
  return <section className="grid gap-4">
      <div>
        <h2 className="text-2xl font-black text-ink">Availability</h2>
        <p className="mt-1 text-sm text-graphite">{format(/* @__PURE__ */ new Date(), "MMMM yyyy")}</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
    const dayString = format(day, "yyyy-MM-dd");
    const range = car.bookedRanges.find((item) => item.startDate <= dayString && dayString < item.endDate);
    const isHeld = range?.status === "pending_payment";
    const isBooked = range?.status === "confirmed";
    return <div
      key={dayString}
      className={`grid aspect-square min-h-12 place-items-center rounded-md border text-sm font-bold ${isBooked ? "border-ember/30 bg-ember/10 text-ember" : isHeld ? "border-saffron/40 bg-saffron/10 text-ink" : "border-line bg-white text-ink"}`}
      title={isBooked ? "Booked" : isHeld ? "Held" : "Available"}
    >
              <span>{formatShortDay(day)}</span>
              {isBooked ? <X className="h-3 w-3" aria-hidden="true" /> : isHeld ? <Clock className="h-3 w-3" aria-hidden="true" /> : <Check className="h-3 w-3 text-basil" aria-hidden="true" />}
            </div>;
  })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-graphite">
        <span className="inline-flex items-center gap-1">
          <Check className="h-3 w-3 text-basil" aria-hidden="true" />
          Available
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3 text-saffron" aria-hidden="true" />
          Checkout hold
        </span>
        <span className="inline-flex items-center gap-1">
          <X className="h-3 w-3 text-ember" aria-hidden="true" />
          Booked
        </span>
      </div>
    </section>;
}
export {
  AvailabilityCalendar
};
