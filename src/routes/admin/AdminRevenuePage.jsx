import { DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { formatMoney } from "../../lib/money";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/browser";

function AdminRevenuePage() {
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_revenue: 0,
    cancelled_revenue: 0,
    confirmed_bookings: 0,
    pending_bookings: 0,
    cancelled_bookings: 0
  });

  useEffect(() => {
    async function loadStats() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data } = await supabase.rpc('get_admin_dashboard_stats');
        if (data) setStats(data);
      } catch (err) {
        console.error("Error loading revenue stats", err);
      }
    }
    loadStats();
  }, []);

  const rows = [
    { label: "Confirmed revenue", value: stats.total_revenue, count: stats.confirmed_bookings, tone: "text-basil" },
    { label: "Pending checkout", value: stats.pending_revenue, count: stats.pending_bookings, tone: "text-saffron" },
    { label: "Lost to cancellations", value: stats.cancelled_revenue, count: stats.cancelled_bookings, tone: "text-ember" }
  ];
  return <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Finance</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Revenue</h1>
      </div>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <DollarSign className="h-8 w-8 text-teal" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-graphite">Total confirmed</p>
        <p className="mt-2 text-5xl font-black text-ink">{formatMoney(stats.total_revenue)}</p>
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
