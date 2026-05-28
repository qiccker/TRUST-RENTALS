import { useState } from "react";
import { Input } from "../ui/Field";

/**
 * Converts an ISO date string (yyyy-MM-dd) to dd/MM/yyyy for display.
 */
function isoToDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Converts a dd/MM/yyyy string to ISO yyyy-MM-dd.
 * Returns "" if the input is incomplete or invalid.
 */
function displayToIso(display) {
  if (!display) return "";
  const parts = display.split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y || y.length !== 4) return "";
  const day = d.padStart(2, "0");
  const month = m.padStart(2, "0");
  const numDay = Number(day);
  const numMonth = Number(month);
  const numYear = Number(y);
  if (numDay < 1 || numDay > 31 || numMonth < 1 || numMonth > 12 || numYear < 2000) return "";
  return `${y}-${month}-${day}`;
}

/**
 * Auto-inserts "/" separators as the user types digits.
 */
function autoFormat(raw) {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function DateRangePicker({ startDate, endDate, onChange }) {
  // Local display states for typing intermediate values
  const [startDisplay, setStartDisplay] = useState(() => isoToDisplay(startDate));
  const [endDisplay, setEndDisplay] = useState(() => isoToDisplay(endDate));

  function handleStartChange(event) {
    const formatted = autoFormat(event.target.value);
    setStartDisplay(formatted);
    const iso = displayToIso(formatted);
    if (iso) {
      onChange({ startDate: iso, endDate });
    } else if (formatted === "") {
      onChange({ startDate: "", endDate });
    }
  }

  function handleEndChange(event) {
    const formatted = autoFormat(event.target.value);
    setEndDisplay(formatted);
    const iso = displayToIso(formatted);
    if (iso) {
      onChange({ startDate, endDate: iso });
    } else if (formatted === "") {
      onChange({ startDate, endDate: "" });
    }
  }

  // Sync display when parent changes the prop (e.g. reset)
  const startFromProp = isoToDisplay(startDate);
  const endFromProp = isoToDisplay(endDate);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input
        label="Pickup date"
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={startDisplay || startFromProp}
        onChange={handleStartChange}
        maxLength={10}
        required
      />
      <Input
        label="Return date"
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={endDisplay || endFromProp}
        onChange={handleEndChange}
        maxLength={10}
        required
      />
    </div>
  );
}
export { DateRangePicker };
