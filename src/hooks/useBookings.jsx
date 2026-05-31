import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase/browser";
import { useAuth } from "./useAuth";
const STORAGE_KEY = "trust-rentals-bookings";
const BookingsContext = createContext(null);

function BookingsProvider({ children }) {
  const [bookings, setBookings] = useState(() => {
    if (isSupabaseConfigured) return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  
  const { user } = useAuth();

  const fetchBookings = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    try {
      // If admin/staff, fetch all. If customer, fetch own.
      let query = supabase.from("bookings").select(`
        *,
        cars (name)
      `).order('created_at', { ascending: false });
      
      if (user.role === 'customer') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const formatted = data.map(b => ({
        id: b.id,
        carId: b.car_id,
        userId: b.user_id,
        carName: b.cars?.name || 'Unknown Car',
        startDate: b.start_date,
        endDate: b.end_date,
        totalPrice: Number(b.total_price),
        status: b.status,
        customerName: b.customer_name,
        customerEmail: b.customer_email,
        customerPhone: b.customer_phone,
        createdAt: b.created_at
      }));
      setBookings(formatted);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, [user]);

  // Fetch bookings on mount and when user changes
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  }, [bookings]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    
    const channel = supabase.channel('bookings-all')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        // Update the specific booking in the local state optimistically
        setBookings(current => current.map(b => 
          b.id === payload.new.id ? { ...b, status: payload.new.status } : b
        ));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        // For new inserts, it's safer to fetch the specific booking because we need the joined car name
        // Realtime payloads don't include joined table data
        if (user.role !== 'customer' || payload.new.user_id === user.id) {
          fetchBookings(); // We could fetch just the single row, but for simplicity we reload
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBookings]);

  const value = useMemo(
    () => ({
      bookings,
      fetchBookings,
      async createBooking(draft, status = "confirmed") {
        const booking = {
          id: crypto.randomUUID(),
          carId: draft.car.id,
          userId: draft.userId,
          carName: draft.car.name,
          startDate: draft.startDate,
          endDate: draft.endDate,
          totalPrice: draft.totalPrice,
          status,
          customerName: draft.customerName,
          customerEmail: draft.customerEmail,
          customerPhone: draft.customerPhone,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };

        if (isSupabaseConfigured && supabase) {
          const insertData = {
            car_id: draft.car.id,
            user_id: draft.userId,
            start_date: draft.startDate,
            end_date: draft.endDate,
            customer_name: draft.customerName,
            customer_email: draft.customerEmail,
            customer_phone: draft.customerPhone || null,
            total_price: draft.totalPrice,
            status: status
          };

          // pending_payment bookings require an expires_at (DB constraint)
          if (status === "pending_payment") {
            insertData.expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
          }

          const { data, error } = await supabase.from("bookings").insert(insertData).select('id, created_at').single();
          
          if (error) {
            console.error("Error inserting booking into Supabase:", error);
            if (error.message && error.message.includes("bookings_no_overlapping_active_dates")) {
              throw new Error("YOU HAVE BOOKED AN OTHER CAR ON THIS DATE");
            }
            throw error;
          }
          if (data) {
            booking.id = data.id;
            booking.createdAt = data.created_at;
          }
        }

        setBookings((current) => [booking, ...current]);
        return booking;
      },
      async updateBookingStatus(bookingId, status, reason = null) {
        if (isSupabaseConfigured && supabase) {
          // If the status is being updated by an admin/staff, use the RPC for logging.
          // Customers cancel bookings directly using the old update statement, which we can still support here
          // if user role is customer, otherwise we use the RPC.
          if (user?.role === 'customer' && status === 'cancelled') {
             const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
             if (error) throw new Error(error.message);
          } else {
             const { error } = await supabase.rpc('admin_update_booking_status', {
               p_booking_id: bookingId,
               p_new_status: status,
               p_reason: reason
             });
             if (error) throw new Error(error.message);
          }
          
          // Simulated email notification
          if (status === 'confirmed') {
            console.log(`[SIMULATED EMAIL] To customer: Your booking ${bookingId} has been Approved and Confirmed!`);
          } else if (status === 'rejected') {
            console.log(`[SIMULATED EMAIL] To customer: Your booking ${bookingId} was Rejected. Reason: ${reason || 'None provided'}`);
          }
        }
        setBookings(
          (current) => current.map((booking) => booking.id === bookingId ? { ...booking, status } : booking)
        );
      },
      async fetchPaginatedBookings(page = 1, pageSize = 10) {
        if (!isSupabaseConfigured || !supabase) return { data: [], count: 0 };
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        let query = supabase
          .from("bookings")
          .select(`*, cars(name)`, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
          
        if (user?.role === 'customer') {
          query = query.eq('user_id', user.id);
        }
        
        const { data, count, error } = await query;
        if (error) {
          console.error("Error fetching paginated bookings:", error);
          return { data: [], count: 0 };
        }
        
        const formatted = data.map(b => ({
          id: b.id,
          carId: b.car_id,
          userId: b.user_id,
          carName: b.cars?.name || 'Unknown Car',
          startDate: b.start_date,
          endDate: b.end_date,
          totalPrice: Number(b.total_price),
          status: b.status,
          customerName: b.customer_name,
          customerEmail: b.customer_email,
          customerPhone: b.customer_phone,
          createdAt: b.created_at
        }));
        
        return { data: formatted, count: count || 0 };
      }
    }),
    [bookings, fetchBookings]
  );
  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}
function useBookings() {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error("useBookings must be used inside BookingsProvider");
  }
  return context;
}
export {
  BookingsProvider,
  useBookings
};
