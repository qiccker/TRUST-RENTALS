import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useBookings } from "../../hooks/useBookings";
import { formatDisplayDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";

function ReceiptPage() {
  const { bookingId } = useParams();
  const { bookings } = useBookings();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (bookings.length > 0) {
      const found = bookings.find((b) => b.id === bookingId);
      setBooking(found);
    }
  }, [bookings, bookingId]);

  if (!booking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
        <p className="text-lg text-graphite">Loading receipt details...</p>
      </div>
    );
  }

  return (
    <div className="bg-mist min-h-screen py-12 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Controls - Hidden when printing */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link to="/account/bookings" className="text-sm font-semibold text-teal hover:underline">
            &larr; Back to My Bookings
          </Link>
          <div className="flex gap-3">
            <Button 
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="rounded-xl border border-line bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-line pb-8">
            <div>
              <h1 className="text-3xl font-black text-ink">TRUST RENTALS</h1>
              <p className="mt-1 text-sm text-graphite">123 Car Rental Drive</p>
              <p className="text-sm text-graphite">contact@trustrentals.com</p>
            </div>
            <div className="mt-6 sm:mt-0 sm:text-right">
              <h2 className="text-xl font-black text-ink uppercase tracking-wider">Payment Receipt</h2>
              <p className="mt-1 text-sm font-semibold text-graphite">
                Receipt #: {booking.id.split("-")[0].toUpperCase()}
              </p>
              <p className="text-sm text-graphite">
                Date: {new Date(booking.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Customer & Booking Details */}
          <div className="grid gap-8 py-8 sm:grid-cols-2 border-b border-line">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">Billed To</h3>
              <p className="mt-2 text-base font-semibold text-ink">{booking.customerName}</p>
              <p className="text-sm text-graphite">{booking.customerEmail}</p>
              <p className="text-sm text-graphite">{booking.customerPhone}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal">Rental Details</h3>
              <div className="mt-2 grid grid-cols-[100px_1fr] gap-1 text-sm">
                <span className="font-semibold text-ink">Vehicle:</span>
                <span className="text-graphite">{booking.carName}</span>
                
                <span className="font-semibold text-ink">Pick-up:</span>
                <span className="text-graphite">{formatDisplayDate(booking.startDate)}</span>
                
                <span className="font-semibold text-ink">Drop-off:</span>
                <span className="text-graphite">{formatDisplayDate(booking.endDate)}</span>
                
                <span className="font-semibold text-ink">Status:</span>
                <span className="text-graphite capitalize">{booking.status.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="py-8 border-b border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal mb-4">Charges</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-3 font-semibold text-ink">Description</th>
                  <th className="pb-3 font-semibold text-ink text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 text-graphite">Car Rental ({booking.carName})</td>
                  <td className="py-4 text-right text-ink font-semibold">{formatMoney(booking.totalPrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Subtotal</span>
                <span className="text-ink font-semibold">{formatMoney(booking.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Tax</span>
                <span className="text-ink font-semibold">Included</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <span className="text-lg font-black text-ink">Total Paid</span>
                <span className="text-lg font-black text-teal">{formatMoney(booking.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-xs text-graphite">
            <p>Thank you for choosing Trust Rentals!</p>
            <p className="mt-1">For any queries regarding this receipt, please contact support.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export { ReceiptPage };
