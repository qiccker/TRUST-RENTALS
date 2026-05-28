import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
function PageShell() {
  return <div className="flex min-h-screen flex-col bg-white text-ink">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>;
}
export {
  PageShell
};
