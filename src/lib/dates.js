import { differenceInCalendarDays, eachDayOfInterval, format, isValid, parseISO } from "date-fns";
function parseDate(value) {
  const date = parseISO(value);
  return isValid(date) ? date : null;
}
function rentalDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) {
    return 0;
  }
  return Math.max(differenceInCalendarDays(end, start), 0);
}
function formatDisplayDate(value) {
  const date = parseDate(value);
  return date ? format(date, "dd/MM/yyyy") : "Select date";
}
function formatShortDay(value) {
  return format(value, "d");
}
function upcomingDays(count = 21) {
  const today = /* @__PURE__ */ new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + count - 1);
  return eachDayOfInterval({ start: today, end });
}
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
export {
  formatDisplayDate,
  formatShortDay,
  parseDate,
  rangesOverlap,
  rentalDays,
  upcomingDays
};
