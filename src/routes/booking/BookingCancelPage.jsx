import { XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
function BookingCancelPage() {
  return <section className="bg-mist py-16">
      <div className="mx-auto max-w-xl rounded-md border border-line bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto h-12 w-12 text-ember" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-black text-ink">Checkout cancelled</h1>
        <p className="mt-3 text-sm leading-6 text-graphite">
          No payment was captured. Pending checkout holds expire automatically.
        </p>
        <Link to="/fleet" className="mt-6 inline-block">
          <Button>Return to fleet</Button>
        </Link>
      </div>
    </section>;
}
export {
  BookingCancelPage
};
