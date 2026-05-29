import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { useBookings } from "../../hooks/useBookings";
import { useAuth } from "../../hooks/useAuth";
import { formatDisplayDate } from "../../lib/dates";
import { formatMoney } from "../../lib/money";

function AdminBookingsPage() {
  const { fetchPaginatedBookings, updateBookingStatus } = useBookings();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [paginatedBookings, setPaginatedBookings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [approveModal, setApproveModal] = useState({ isOpen: false, booking: null, paymentReceived: false });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, booking: null, reason: "" });
  
  const pageSize = 10;
  
  const loadPage = useCallback(async (p) => {
    setIsLoading(true);
    const { data, count } = await fetchPaginatedBookings(p, pageSize);
    setPaginatedBookings(data);
    setTotalCount(count);
    setIsLoading(false);
  }, [fetchPaginatedBookings]);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const handleUpdateStatus = async (id, status, reason = null) => {
    try {
      await updateBookingStatus(id, status, reason);
      // Optimistically update the local paginated list
      setPaginatedBookings(current => current.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleApprove = async () => {
    if (!approveModal.booking) return;
    await handleUpdateStatus(approveModal.booking.id, "confirmed");
    setApproveModal({ isOpen: false, booking: null, paymentReceived: false });
  };

  const handleReject = async () => {
    if (!rejectModal.booking) return;
    await handleUpdateStatus(rejectModal.booking.id, "rejected", rejectModal.reason);
    setRejectModal({ isOpen: false, booking: null, reason: "" });
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return "bg-basil/10 text-basil";
      case 'rejected': return "bg-ember/10 text-ember";
      case 'pending_payment': return "bg-saffron/10 text-saffron";
      case 'cancelled': return "bg-graphite/10 text-graphite";
      default: return "bg-mist text-graphite";
    }
  };

  return <div className="grid gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Booking control</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Bookings</h1>
      </div>

      <div className={`grid gap-4 ${isLoading ? 'opacity-50' : ''}`}>
        {paginatedBookings.map((booking) => <article key={booking.id} className="rounded-md border border-line bg-white p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black text-ink">{booking.carName}</h2>
                  <span className={`rounded-md px-3 py-1 text-xs font-bold capitalize ${getStatusBadge(booking.status)}`}>
                    {booking.status === 'confirmed' ? 'Approved' : booking.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-graphite md:grid-cols-4">
                  <span>{booking.customerName}</span>
                  <span>{booking.customerEmail}</span>
                  <span>
                    {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                  </span>
                  <strong className="text-ink">{formatMoney(booking.totalPrice)}</strong>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(booking.status === "pending_payment" || user?.role === 'admin' || user?.role === 'staff') && booking.status !== "confirmed" && booking.status !== "cancelled" && (
                  <Button
                    variant="secondary"
                    onClick={() => setApproveModal({ isOpen: true, booking, paymentReceived: false })}
                    leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  >
                    Approve
                  </Button>
                )}
                {(booking.status === "pending_payment" || user?.role === 'admin' || user?.role === 'staff') && booking.status !== "rejected" && booking.status !== "cancelled" && (
                  <Button
                    variant="danger"
                    onClick={() => setRejectModal({ isOpen: true, booking, reason: "" })}
                    leftIcon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </article>)}

        {paginatedBookings.length === 0 && !isLoading && (
          <div className="rounded-md border border-line bg-white p-8 text-center text-graphite">
            No bookings found.
          </div>
        )}
      </div>

      {totalCount > pageSize && (
        <div className="flex items-center justify-between border-t border-line pt-4">
          <p className="text-sm text-graphite">
            Showing <span className="font-bold text-ink">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-ink">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-bold text-ink">{totalCount}</span> bookings
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1 || isLoading}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || isLoading}
            >
              Next <ChevronRight className="h-4 w-4 ml-2 -mr-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ink">Confirm Approval</h2>
              <button onClick={() => setApproveModal({ isOpen: false, booking: null, paymentReceived: false })} className="text-graphite hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-graphite">
              Has the payment been received for this booking? Approving will confirm the vehicle reservation.
            </p>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-line bg-mist/30 p-4">
              <input
                type="checkbox"
                id="payment-received"
                className="h-5 w-5 rounded border-line text-teal focus:ring-teal"
                checked={approveModal.paymentReceived}
                onChange={(e) => setApproveModal(prev => ({ ...prev, paymentReceived: e.target.checked }))}
              />
              <label htmlFor="payment-received" className="text-sm font-bold text-ink">
                Payment Received
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setApproveModal({ isOpen: false, booking: null, paymentReceived: false })}>
                Cancel
              </Button>
              <Button disabled={!approveModal.paymentReceived} onClick={handleApprove}>
                Confirm Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ember">Reject Booking</h2>
              <button onClick={() => setRejectModal({ isOpen: false, booking: null, reason: "" })} className="text-graphite hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-graphite">
              Please provide a reason for rejecting this booking (optional). This will be included in the customer notification.
            </p>
            <textarea
              className="mt-4 w-full rounded-md border border-line p-3 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              rows={3}
              placeholder="e.g. Payment not received, documents invalid..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRejectModal({ isOpen: false, booking: null, reason: "" })}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Reject Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>;
}
export {
  AdminBookingsPage
};
