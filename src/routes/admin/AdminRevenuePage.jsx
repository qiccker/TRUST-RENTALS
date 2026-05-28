import { DollarSign } from "lucide-react";
import { useEffect } from "react";
import { useBookings } from "../../hooks/useBookings";
import { formatMoney } from "../../lib/money";

function AdminRevenuePage() {
  const { bookings, fetchBookings } = useBookings();
  
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  const pending = bookings.filter((booking) => booking.status === "pending_payment");
  const cancelled = bookings.filter((booking) => booking.status === "cancelled");
  const revenue = confirmed.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const pendingRevenue = pending.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const rows = [
    { label: "Confirmed revenue", value: revenue, count: confirmed.length, tone: "text-basil" },
    { label: "Pending checkout", value: pendingRevenue, count: pending.length, tone: "text-saffron" },
    { label: "Cancelled bookings", value: 0, count: cancelled.length, tone: "text-ember" }
  ];
  return <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Finance</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Revenue</h1>
      </div>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <DollarSign className="h-8 w-8 text-teal" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-graphite">Total confirmed</p>
        <p className="mt-2 text-5xl font-black text-ink">{formatMoney(revenue)}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {rows.map((row) => <article key={row.label} className="rounded-md border border-line bg-white p-5 shadow-sm">
            <p className={`text-3xl font-black ${row.tone}`}>{formatMoney(row.value)}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{row.label}</p>
            <p className="mt-1 text-sm text-graphite">{row.count} bookings</p>
          </article>)}
      </div>
    </div>;
}
export {
  AdminRevenuePage
};
