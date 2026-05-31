import { useCallback, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase/browser";
import { useAuth } from "./useAuth";

export function useReviews() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviewsForCar = useCallback(async (carId) => {
    if (!isSupabaseConfigured || !supabase || !carId) return [];
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("car_id", carId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        bookingId: r.booking_id,
        carId: r.car_id,
        userId: r.user_id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        customerName: r.profiles?.full_name || "Customer"
      }));
    } catch (err) {
      console.error("Error fetching reviews:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReviewForBooking = useCallback(async (bookingId) => {
    if (!isSupabaseConfigured || !supabase || !bookingId) return null;
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        bookingId: data.booking_id,
        carId: data.car_id,
        userId: data.user_id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.created_at
      };
    } catch (err) {
      console.error("Error fetching review for booking:", err);
      return null;
    }
  }, []);

  const submitReview = useCallback(async (bookingId, carId, rating, comment) => {
    if (!isSupabaseConfigured || !supabase || !user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: bookingId,
        car_id: carId,
        user_id: user.id,
        rating,
        comment: comment || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, [user]);

  const updateReview = useCallback(async (reviewId, rating, comment) => {
    if (!isSupabaseConfigured || !supabase) throw new Error("Not configured");

    const { error } = await supabase
      .from("reviews")
      .update({ rating, comment: comment || null })
      .eq("id", reviewId);

    if (error) throw error;
  }, []);

  return {
    isLoading,
    fetchReviewsForCar,
    fetchReviewForBooking,
    submitReview,
    updateReview
  };
}
