import { CarFront, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { useAuth } from "../../hooks/useAuth";
const navItems = [];
function Header() {
  const { user, signOut } = useAuth();
  return <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-ink" aria-label="TRUST RENTALS home">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white">
            <CarFront className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-black tracking-normal">TRUST</span>
            <span className="block text-xs font-bold tracking-[0.18em] text-teal">RENTALS</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto px-2">
          {navItems.map((item) => <NavLink
    key={item.to}
    to={item.to}
    className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${isActive ? "bg-mist text-teal" : "text-graphite hover:bg-mist hover:text-ink"}`}
  >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>)}
        </nav>

        <div className="flex items-center gap-2">
          {user ? <>
              <Link to="/account" className="flex items-center gap-3 hover:bg-mist p-1.5 pr-4 rounded-full transition border border-transparent hover:border-line">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-teal text-xs font-bold text-white shadow-sm">
                  {user.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-sm text-left">
                  <p className="truncate font-semibold text-ink">Hello, {user.fullName?.split(" ")[0] || "User"}</p>
                </div>
              </Link>
            </> : <Link
    to="/login"
    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-mist"
  >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Link>}
        </div>
      </div>
    </header>;
}
export {
  Header
};
