import { Star, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useReviews } from "../../hooks/useReviews";

export function ReviewsList({ carId }) {
  const { fetchReviewsForCar, isLoading } = useReviews();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await fetchReviewsForCar(carId);
      setReviews(data);
    }
    load();
  }, [carId, fetchReviewsForCar]);

  if (isLoading) {
    return (
      <div className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">Customer Reviews</h2>
        <div className="mt-4 flex flex-col items-center py-6 text-center">
          <MessageSquare className="h-8 w-8 text-graphite/30 mb-2" />
          <p className="text-sm text-graphite">No reviews yet. Be the first to review this vehicle!</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  return (
    <div className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-ink">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= Math.round(avgRating) ? "fill-saffron text-saffron" : "text-graphite/30"}`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-ink">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-graphite">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-md border border-line/70 bg-mist/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-sm font-black text-teal">
                  {review.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{review.customerName}</p>
                  <p className="text-xs text-graphite">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-saffron text-saffron" : "text-graphite/30"}`}
                  />
                ))}
              </div>
            </div>
            {review.comment && (
              <p className="mt-3 text-sm leading-6 text-graphite">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
