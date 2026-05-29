import { ArrowRight, BadgeCheck, CarFront } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CarCard } from "../../components/fleet/CarCard";
import { Button } from "../../components/ui/Button";
import { useCars } from "../../hooks/useCars";

function FleetPage() {
  const { cars, isLoading, fetchCars } = useCars();

  useEffect(() => {
    fetchCars(false); // only available cars
  }, [fetchCars]);

  return <>
    <section 
      className="relative min-h-[560px] overflow-hidden bg-ink text-white bg-cover bg-center"
      style={{ backgroundImage: 'url(/indian-fleet-hero.png)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 text-sm font-bold backdrop-blur">
            <BadgeCheck className="h-4 w-4 text-saffron" aria-hidden="true" />
            Trusted daily rentals with real-time availability
          </p>
          <h1 className="text-5xl font-black leading-tight tracking-normal sm:text-6xl lg:text-7xl">
            TRUST RENTALS
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/84">
            Browse premium sedans, SUVs, EVs, and vans with clear pricing, date holds, checkout, and account booking history.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#fleet-results">
              <Button leftIcon={<CarFront className="h-4 w-4" aria-hidden="true" />}>Browse fleet</Button>
            </a>
            <Link to="/account/bookings">
              <Button variant="secondary" leftIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                My bookings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section id="fleet-results" className="bg-mist py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">Fleet showcase</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Choose your vehicle</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-graphite">
            Prices are calculated per rental day. Confirmed and checkout-held dates are blocked before payment is accepted.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cars.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        )}

        {!isLoading && cars.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-8 text-center">
            <CarFront className="mx-auto h-10 w-10 text-graphite/40 mb-3" />
            <p className="text-lg font-bold text-ink">No vehicles available yet.</p>
            <p className="mt-2 text-sm text-graphite">Check back soon — our fleet is being updated.</p>
          </div>
        ) : null}
      </div>
    </section>
  </>;
}
export {
  FleetPage
};
