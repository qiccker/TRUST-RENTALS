import { CarFront, Contact, IndianRupee, UsersRound, BarChart3, CalendarDays } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { formatMoney } from "../../lib/money";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/browser";

function AdminOverviewPage() {
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_cars: 0,
    available_cars: 0,
    total_customers: 0,
    total_staff: 0,
    // Note: get_admin_dashboard_stats also returns pending_revenue, cancelled_revenue etc.
    pending_revenue: 0,
    cancelled_revenue: 0,
    confirmed_bookings: 0,
    pending_bookings: 0,
    cancelled_bookings: 0
  });
  const [recentRentals, setRecentRentals] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSupabaseConfigured || !supabase) return;
      
      try {
        const { data: statsData } = await supabase.rpc('get_admin_dashboard_stats');
        if (statsData) setStats(statsData);

        const { data: recentData } = await supabase
          .from('bookings')
          .select(`*, cars(name)`)
          .in('status', ['confirmed', 'pending_payment'])
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentData) {
          setRecentRentals(recentData.map(b => ({
            id: b.id,
            customerName: b.customer_name,
            carName: b.cars?.name || 'Unknown Car',
            startDate: b.start_date,
            endDate: b.end_date,
            totalPrice: Number(b.total_price)
          })));
        }

        // Fetch all confirmed bookings to group by month
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select('total_price, created_at')
          .eq('status', 'confirmed')
          .order('created_at', { ascending: true });

        if (!error && bookingsData) {
          const grouped = bookingsData.reduce((acc, booking) => {
            const date = new Date(booking.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            if (!acc[key]) {
              acc[key] = { key, label: monthName, revenue: 0, count: 0 };
            }
            acc[key].revenue += Number(booking.total_price);
            acc[key].count += 1;
            return acc;
          }, {});

          const monthlyArray = Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key));
          setMonthlyData(monthlyArray);
        }

      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  const maxRevenue = useMemo(() => {
    if (monthlyData.length === 0) return 100;
    return Math.max(...monthlyData.map(m => m.revenue));
  }, [monthlyData]);

  // Calculate rental duration in days
  function getDays(start, end) {
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  // Format date for display
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  const metrics = [
    {
      label: "Total Cars",
      value: stats.total_cars,
      sub: `${stats.available_cars} available`,
      icon: CarFront,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Customers",
      value: stats.total_customers,
      sub: "registered",
      icon: UsersRound,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Staff",
      value: stats.total_staff,
      sub: "active",
      icon: Contact,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Total Sales",
      value: formatMoney(stats.total_revenue || 0),
      sub: `Lifetime confirmed revenue`,
      icon: IndianRupee,
      color: "bg-[rgb(59_130_246_/_0.5)]",
      large: true,
    },
  ];

  const revenueRows = [
    { label: "Confirmed revenue", value: stats.total_revenue, count: stats.confirmed_bookings, tone: "text-[#10b981]" },
    { label: "Pending checkout", value: stats.pending_revenue, count: stats.pending_bookings, tone: "text-[#f59e0b]" },
    { label: "Lost to cancellations", value: stats.cancelled_revenue, count: stats.cancelled_bookings, tone: "text-[#ef4444]" }
  ];

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1e293b]">Dashboard</h1>
        <p className="mt-1 text-[14px] text-[rgb(59_130_246_/_0.5)] font-medium">
          Overview of your rental business
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-semibold text-[#94a3b8]">{m.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`font-extrabold text-[#1e293b] ${m.large ? "text-[28px]" : "text-[32px]"}`}>
                {m.value}
              </p>
              <p className="mt-0.5 text-[12px] text-[#94a3b8]">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Monthly Sales Trend Chart */}
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-[#e2e8f0] pb-4">
            <BarChart3 className="h-5 w-5 text-[rgb(59_130_246_/_0.5)]" />
            <h2 className="text-[18px] font-bold text-[#1e293b]">Monthly Sales Trend</h2>
          </div>
          
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(59_130_246_/_0.5)]/30 border-t-[rgb(59_130_246_/_0.5)]" />
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-[#94a3b8]">
              No confirmed sales data available yet.
            </div>
          ) : (
            <div className="flex h-64 items-end gap-2 overflow-x-auto pb-2">
              {monthlyData.map((month) => {
                const heightPercent = Math.max((month.revenue / maxRevenue) * 100, 2);
                return (
                  <div key={month.key} className="group relative flex flex-1 min-w-[60px] max-w-[100px] flex-col items-center justify-end h-full">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 z-10">
                      <div className="rounded bg-[#1e293b] px-3 py-1.5 text-center text-xs text-white shadow-lg whitespace-nowrap">
                        <p className="font-bold">{formatMoney(month.revenue)}</p>
                        <p className="text-[10px] text-[#94a3b8]">{month.count} bookings</p>
                      </div>
                      <div className="absolute left-1/2 top-full -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e293b]"></div>
                    </div>

                    <div 
                      className="w-full rounded-t-md bg-[rgb(59_130_246_/_0.5)]/20 transition-all group-hover:bg-[rgb(59_130_246_/_0.5)] cursor-default"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="w-full h-1 bg-[rgb(59_130_246_/_0.5)] rounded-t-md"></div>
                    </div>
                    
                    <span className="mt-3 text-[12px] font-semibold text-[#94a3b8] whitespace-nowrap">
                      {month.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Detailed Revenue Cards */}
        <div className="grid gap-4">
          {revenueRows.map((row) => (
            <article key={row.label} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
              <p className={`text-[24px] font-black ${row.tone}`}>{formatMoney(row.value)}</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1e293b]">{row.label}</p>
              <p className="mt-0.5 text-[12px] text-[#94a3b8]">{row.count} bookings</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Calendar-wise Breakdown Table */}
        <section className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[rgb(59_130_246_/_0.5)]" />
            <h2 className="text-[16px] font-bold text-[#1e293b]">Calendar-wise Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-[11px] uppercase tracking-wider text-[#94a3b8]">
                <tr className="border-b border-[#e2e8f0]">
                  <th className="px-5 py-3 font-bold">Month</th>
                  <th className="px-5 py-3 font-bold">Bookings</th>
                  <th className="px-5 py-3 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-[#94a3b8]">Loading...</td>
                  </tr>
                ) : monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-[#94a3b8]">No data available.</td>
                  </tr>
                ) : (
                  [...monthlyData].reverse().map((month) => (
                    <tr key={month.key} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#1e293b]">{month.label}</td>
                      <td className="px-5 py-3 text-[13px] text-[#64748b]">{month.count}</td>
                      <td className="px-5 py-3 font-black text-[#1e293b] text-right">
                        {formatMoney(month.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Rentals */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm flex flex-col">
          <h2 className="mb-5 text-[18px] font-bold text-[#1e293b]">Recent Rentals</h2>
          <div className="grid gap-0 divide-y divide-[#f1f5f9] flex-1">
            {recentRentals.length > 0 ? (
              recentRentals.map((b) => {
                const days = getDays(b.startDate, b.endDate);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-[#1e293b]">
                        {b.customerName} → {b.carName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#94a3b8]">
                        {formatDate(b.startDate)} · {days} day{days !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-[15px] font-bold text-[#1e293b]">
                      {formatMoney(b.totalPrice)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-[14px] text-[#94a3b8]">
                No rentals yet
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export { AdminOverviewPage };
