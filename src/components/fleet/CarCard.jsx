import { Armchair, CalendarDays, Fuel, Gauge, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { vehicleTypeLabels } from "../../data/fleet";
import { formatMoney } from "../../lib/money";
import { Button } from "../ui/Button";
function CarCard({ car }) {
  return <article className="overflow-hidden rounded-md border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <Link to={`/cars/${car.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-mist">
          <img className="h-full w-full object-cover" src={car.images[0]} alt={`${car.name} rental car`} />
        </div>
      </Link>
      <div className="grid gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{vehicleTypeLabels[car.type]}</p>
            <h2 className="mt-1 text-xl font-black text-ink">{car.name}</h2>
          </div>
          <div className="rounded-md bg-mist px-3 py-2 text-right">
            <p className="text-lg font-black text-ink">{formatMoney(car.pricePerDay)}</p>
            <p className="text-xs font-bold text-graphite">per day</p>
          </div>
        </div>

        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-graphite">{car.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-graphite">
          <span className="inline-flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-teal" aria-hidden="true" />
            {car.seats} seats
          </span>
          <span className="inline-flex items-center gap-2">
            <Fuel className="h-4 w-4 text-teal" aria-hidden="true" />
            {car.fuelType}
          </span>
          <span className="inline-flex items-center gap-2 capitalize">
            <Gauge className="h-4 w-4 text-teal" aria-hidden="true" />
            {car.transmission}
          </span>
          <span className="inline-flex items-center gap-2">
            <Armchair className="h-4 w-4 text-teal" aria-hidden="true" />
            {car.luggageCapacity} bags
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/cars/${car.slug}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Details
            </Button>
          </Link>
          <Link to={`/book/${car.slug}`} className="flex-1">
            <Button className="w-full" leftIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}>
              Book
            </Button>
          </Link>
        </div>
      </div>
    </article>;
}
export {
  CarCard
};
