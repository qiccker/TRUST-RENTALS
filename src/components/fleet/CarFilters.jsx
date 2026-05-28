import { SlidersHorizontal, X } from "lucide-react";
import { vehicleTypeLabels } from "../../data/fleet";
import { Button } from "../ui/Button";
import { Select } from "../ui/Field";
const vehicleTypes = ["all", "sedan", "suv", "ev", "van", "luxury"];
function CarFilters({ filters, onChange, resultCount }) {
  return <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Select
    label="Vehicle type"
    value={filters.type}
    onChange={(event) => onChange({ ...filters, type: event.target.value })}
  >
            {vehicleTypes.map((type) => <option key={type} value={type}>
                {type === "all" ? "All vehicles" : vehicleTypeLabels[type]}
              </option>)}
          </Select>

          <Select
    label="Minimum seats"
    value={filters.minSeats}
    onChange={(event) => onChange({ ...filters, minSeats: Number(event.target.value) })}
  >
            {[1, 4, 5, 7, 8].map((seats) => <option key={seats} value={seats}>
                {seats}+ seats
              </option>)}
          </Select>

          <label className="grid gap-2 text-sm font-semibold text-ink">
            <span>Max daily price: ${filters.maxPrice}</span>
            <input
    className="h-11 accent-teal"
    type="range"
    min="60"
    max="160"
    step="10"
    value={filters.maxPrice}
    onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
  />
          </label>
        </div>

        <div className="flex items-end gap-3">
          <div className="inline-flex min-h-11 items-center gap-2 rounded-md bg-mist px-4 text-sm font-bold text-ink">
            <SlidersHorizontal className="h-4 w-4 text-teal" aria-hidden="true" />
            {resultCount} available
          </div>
          <Button variant="secondary" onClick={() => onChange({ type: "all", minSeats: 1, maxPrice: 160 })}>
            <X className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
    </section>;
}
export {
  CarFilters
};
