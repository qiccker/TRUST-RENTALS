import { rentalDays, rangesOverlap } from "../dates";
function validateBookingRange(car, startDate, endDate) {
  const days = rentalDays(startDate, endDate);
  if (!startDate || !endDate) {
    return { ok: false, message: "Choose pickup and return dates." };
  }
  if (days <= 0) {
    return { ok: false, message: "Return date must be after pickup date." };
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (startDate < today) {
    return { ok: false, message: "Pickup date cannot be in the past." };
  }
  const hasConflict = car.bookedRanges.some(
    (range) => rangesOverlap(startDate, endDate, range.startDate, range.endDate)
  );
  if (hasConflict) {
    return { ok: false, message: "This car is already booked for part of that range." };
  }
  return {
    ok: true,
    days,
    totalPrice: days * car.pricePerDay
  };
}
export {
  validateBookingRange
};
