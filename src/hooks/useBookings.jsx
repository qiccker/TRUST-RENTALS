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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  }, [bookings]);

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
          const { data, error } = await supabase.from("bookings").insert({
            car_id: draft.car.id,
            user_id: draft.userId,
            start_date: draft.startDate,
            end_date: draft.endDate,
            customer_name: draft.customerName,
            customer_email: draft.customerEmail,
            customer_phone: draft.customerPhone || null,
            total_price: draft.totalPrice,
            status: status
          }).select('id, created_at').single();
          
          if (error) {
            console.error("Error inserting booking into Supabase:", error);
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
      async updateBookingStatus(bookingId, status) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
          if (error) {
            console.error("Error updating booking status", error);
            alert("Database Error: " + error.message);
            return;
          }
        }
        setBookings(
          (current) => current.map((booking) => booking.id === bookingId ? { ...booking, status } : booking)
        );
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
