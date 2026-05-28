import { User, ReceiptText, LogOut } from "lucide-react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function AccountLayout() {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return <section className="bg-mist py-16 text-center text-sm font-semibold text-graphite">Loading account...</section>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const tabs = [
    { name: "My Profile", href: "/account/profile", icon: <User className="h-4 w-4" /> },
    { name: "My Bookings", href: "/account/bookings", icon: <ReceiptText className="h-4 w-4" /> },
  ];

  return (
    <section className="bg-mist py-10 min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.name}
                    to={tab.href}
                    className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold transition ${
                      isActive 
                        ? "bg-teal text-white shadow-sm" 
                        : "text-graphite hover:bg-white hover:text-ink"
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 border-t border-line pt-4">
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-ember hover:bg-ember/10 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </aside>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </section>
  );
}

export { AccountLayout };
