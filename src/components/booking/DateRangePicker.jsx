import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isWithinInterval, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function DateRangePicker({ startDate, endDate, onChange, bookedRanges = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Convert string ranges to Date objects
  const disabledIntervals = bookedRanges.map(range => ({
    start: parseISO(range.startDate),
    end: parseISO(range.endDate)
  }));

  const isDateDisabled = (date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today) && !isSameDay(date, today)) {
      return true;
    }
    
    // Disable booked dates
    return disabledIntervals.some(interval => {
      // Ensure time parts don't mess up the overlap check
      const start = new Date(interval.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(interval.end);
      // Subtract 1 millisecond so the end date itself is NOT disabled
      // since the car is returned and available on that day.
      end.setHours(0, 0, 0, 0);
      end.setMilliseconds(-1);
      
      return isWithinInterval(date, { start, end });
    });
  };

  // Helper to check if a range overlaps with disabled dates
  const isRangeValid = (start, end) => {
    if (!start || !end) return true;
    // ensure start is before end to generate interval properly
    const intervalStart = isBefore(start, end) ? start : end;
    const intervalEnd = isBefore(start, end) ? end : start;
    
    const days = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    return !days.some(isDateDisabled);
  };

  const handleDateClick = (day) => {
    if (isDateDisabled(day)) return;

    const dayIso = format(day, "yyyy-MM-dd");

    if (!startDate || (startDate && endDate)) {
      // Start a new range
      onChange({ startDate: dayIso, endDate: "" });
    } else {
      // Complete the range
      const start = parseISO(startDate);
      if (isBefore(day, start)) {
        onChange({ startDate: dayIso, endDate: "" });
      } else {
        if (isRangeValid(start, day)) {
          onChange({ startDate, endDate: dayIso });
        } else {
          // If invalid range, just start a new range from this day
          onChange({ startDate: dayIso, endDate: "" });
        }
      }
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between py-2 mb-4">
        <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-mist text-graphite transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-ink">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-mist text-graphite transition">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDateOfWeek = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-bold text-[11px] uppercase tracking-wider text-graphite py-1" key={i}>
          {format(addDays(startDateOfWeek, i), dateFormat).substring(0, 3)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDateOfWeek = startOfWeek(monthStart);
    const endDateOfWeek = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDateOfWeek;
    let formattedDate = "";

    const parsedStart = startDate ? parseISO(startDate) : null;
    const parsedEnd = endDate ? parseISO(endDate) : null;

    while (day <= endDateOfWeek) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isDisabled = isDateDisabled(day);
        const isSelectedStart = parsedStart && isSameDay(day, parsedStart);
        const isSelectedEnd = parsedEnd && isSameDay(day, parsedEnd);
        const isWithinSelection = parsedStart && parsedEnd && day > parsedStart && day < parsedEnd;
        const isCurrentMonth = isSameMonth(day, monthStart);

        let cellContainerClasses = "relative h-10 w-full ";
        let innerClasses = "flex items-center justify-center h-full w-full text-sm font-medium transition-colors z-10 relative ";
        
        // Background strip for the date range
        let bgStripClasses = "absolute inset-y-0 w-full z-0 ";
        let showBgStrip = false;

        if (isWithinSelection) {
          showBgStrip = true;
          bgStripClasses += "bg-teal/10 ";
        } else if (isSelectedStart && parsedEnd && !isSameDay(parsedStart, parsedEnd)) {
          showBgStrip = true;
          bgStripClasses += "bg-teal/10 left-1/2 w-1/2 ";
        } else if (isSelectedEnd && !isSameDay(parsedStart, parsedEnd)) {
          showBgStrip = true;
          bgStripClasses += "bg-teal/10 right-1/2 w-1/2 ";
        }

        // Inner circle styling
        if (!isCurrentMonth) {
          innerClasses += "text-gray-300 ";
        } else if (isDisabled) {
          innerClasses += "text-gray-300 cursor-not-allowed bg-gray-50/50 ";
          // Add a subtle line-through effect using an absolute element inside
        } else {
          innerClasses += "cursor-pointer hover:bg-mist rounded-full ";
        }

        if (isSelectedStart || isSelectedEnd) {
          innerClasses += "bg-teal text-white hover:bg-teal ";
        } else if (isWithinSelection) {
          innerClasses += "text-teal hover:bg-transparent ";
        } else if (!isDisabled && isCurrentMonth) {
          innerClasses += "text-ink ";
        }

        days.push(
          <div className={cellContainerClasses} key={day.toString()} onClick={() => handleDateClick(cloneDay)}>
            {showBgStrip && <div className={bgStripClasses} />}
            <div className={innerClasses}>
              {formattedDate}
              {isDisabled && isCurrentMonth && (
                <span className="absolute inset-x-2 top-1/2 h-[1px] bg-gray-300 block -rotate-12"></span>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-1 mt-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="w-full bg-white border border-line rounded-md p-5 shadow-sm select-none">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      {/* Show the selected dates as text */}
      <div className="mt-5 pt-4 border-t border-line flex justify-between text-sm">
        <div>
          <span className="text-graphite block text-xs uppercase tracking-wider font-bold mb-1">Pickup Date</span>
          <span className="font-bold text-ink">{startDate ? format(parseISO(startDate), "MMM d, yyyy") : "Select date"}</span>
        </div>
        <div className="text-right">
          <span className="text-graphite block text-xs uppercase tracking-wider font-bold mb-1">Return Date</span>
          <span className="font-bold text-ink">{endDate ? format(parseISO(endDate), "MMM d, yyyy") : "Select date"}</span>
        </div>
      </div>
    </div>
  );
}
