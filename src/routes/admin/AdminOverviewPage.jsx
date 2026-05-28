import { CarFront, Contact, IndianRupee, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useBookings } from "../../hooks/useBookings";
import { useCars } from "../../hooks/useCars";
import { useProfiles } from "../../hooks/useProfiles";
import { formatMoney } from "../../lib/money";

function AdminOverviewPage() {
  const { bookings, fetchBookings } = useBookings();
  const { cars, fetchCars } = useCars();
  const { customers, staff, fetchProfiles } = useProfiles();

  useEffect(() => {
    fetchBookings();
    fetchCars(true);
    fetchProfiles();
  }, [fetchBookings, fetchCars, fetchProfiles]);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const availableCars = cars.filter((c) => c.isAvailable !== false).length;

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
      value: cars.length,
      sub: `${availableCars} available`,
      icon: CarFront,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Customers",
      value: customers.length,
      sub: "registered",
      icon: UsersRound,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Staff",
      value: staff.length,
      sub: "active",
      icon: Contact,
      color: "bg-[rgb(59_130_246_/_0.5)]",
    },
    {
      label: "Total Sales",
      value: formatMoney(totalRevenue),
      sub: `${confirmedBookings.length} rental${confirmedBookings.length !== 1 ? "s" : ""}`,
      icon: IndianRupee,
      color: "bg-[rgb(59_130_246_/_0.5)]",
      large: true,
    },
  ];

  // Recent rentals — take the latest 5 confirmed bookings
  const recentRentals = confirmedBookings.slice(0, 5);

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

      {/* Recent Rentals */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-[18px] font-bold text-[#1e293b]">Recent Rentals</h2>
        <div className="grid gap-0 divide-y divide-[#f1f5f9]">
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
              No confirmed rentals yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { AdminOverviewPage };
