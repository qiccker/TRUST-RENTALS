import { Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { useReviews } from "../../hooks/useReviews";

export function ReviewForm({ bookingId, carId, onReviewSubmitted }) {
  const { fetchReviewForBooking, submitReview, updateReview } = useReviews();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setIsLoadingReview(true);
      const review = await fetchReviewForBooking(bookingId);
      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment || "");
      }
      setIsLoadingReview(false);
    }
    load();
  }, [bookingId, fetchReviewForBooking]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, rating, comment);
        setExistingReview({ ...existingReview, rating, comment });
        setSuccess("Review updated!");
        setIsEditing(false);
      } else {
        await submitReview(bookingId, carId, rating, comment);
        setExistingReview({ rating, comment });
        setSuccess("Review submitted! Thank you.");
      }
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingReview) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-graphite" />
        <span className="text-xs text-graphite">Loading review...</span>
      </div>
    );
  }

  // Show existing review (read-only)
  if (existingReview && !isEditing) {
    return (
      <div className="mt-3 rounded-md border border-line bg-mist/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= existingReview.rating ? "fill-saffron text-saffron" : "text-graphite/30"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-teal hover:underline"
          >
            Edit
          </button>
        </div>
        {existingReview.comment && (
          <p className="mt-2 text-sm text-graphite">{existingReview.comment}</p>
        )}
        {success && <p className="mt-2 text-xs font-semibold text-basil">{success}</p>}
      </div>
    );
  }

  // Review form
  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-md border border-line bg-mist/40 p-4 grid gap-3">
      <p className="text-sm font-bold text-ink">
        {existingReview ? "Edit your review" : "Rate your experience"}
      </p>

      {/* Star Rating Picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="rounded p-0.5 transition hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-saffron text-saffron"
                  : "text-graphite/30"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs font-bold text-graphite">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        className="w-full rounded-md border border-line p-3 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal resize-none"
        rows={3}
        placeholder="Tell us about your experience (optional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      {error && <p className="text-xs font-semibold text-ember">{error}</p>}
      {success && <p className="text-xs font-semibold text-basil">{success}</p>}

      <div className="flex items-center gap-2 justify-end">
        {isEditing && (
          <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setRating(existingReview.rating); setComment(existingReview.comment || ""); }}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {existingReview ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
