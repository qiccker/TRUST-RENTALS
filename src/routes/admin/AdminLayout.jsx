import { CarFront, Contact, CalendarCheck, IndianRupee, LayoutDashboard, LogOut, UsersRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/cars", label: "Cars", icon: CarFront },
  { to: "/admin/customers", label: "Customers", icon: UsersRound },
  { to: "/admin/staff", label: "Staff", icon: Contact },
  { to: "/admin/revenue", label: "Total Sales", icon: IndianRupee },
];

function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-[#e2e8f0] bg-white">
        {/* Branding */}
        <div className="px-6 pt-6 pb-5">
          <h1 className="text-[22px] font-extrabold tracking-tight text-[rgb(59_130_246_/_0.5)]">
            Trust Rentals
          </h1>
          <p className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">
            Vehicle Rental Manager
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="grid gap-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-all ${
                    isActive
                      ? "bg-[rgb(59_130_246_/_0.5)] text-white shadow-md shadow-[rgb(59_130_246_/_0.5)]"
                      : "text-[#64748b] hover:bg-[#f0f4f8] hover:text-[#334155]"
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-[#e2e8f0] px-3 py-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-[#64748b] transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[220px] flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export { AdminLayout };
