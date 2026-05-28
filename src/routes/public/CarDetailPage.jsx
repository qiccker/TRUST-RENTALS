import { ArrowLeft, CalendarDays, Fuel, Gauge, Luggage, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AvailabilityCalendar } from "../../components/fleet/AvailabilityCalendar";
import { CarGallery } from "../../components/fleet/CarGallery";
import { Button } from "../../components/ui/Button";
import { vehicleTypeLabels } from "../../data/fleet";
import { formatMoney } from "../../lib/money";
import { isSupabaseConfigured, supabase } from "../../lib/supabase/browser";

function CarDetailPage() {
  const { slug } = useParams();
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCar() {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("cars")
          .select(`*, car_images (id, url, storage_path, is_primary, sort_order)`)
          .eq("slug", slug)
          .single();
        
        if (error) throw error;
        
        setCar({
          ...data,
          pricePerDay: Number(data.price_per_day),
          fuelType: data.fuel_type,
          luggageCapacity: data.luggage_capacity,
          isAvailable: data.is_available,
          images: data.car_images
            ? data.car_images.sort((a, b) => a.sort_order - b.sort_order).map((img) => img.url)
            : [],
          bookedRanges: []
        });
      } catch (err) {
        console.error("Error loading car:", err);
        setCar(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadCar();
  }, [slug]);

  if (isLoading) {
    return (
      <section className="bg-mist py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal/30 border-t-teal" />
      </section>
    );
  }

  if (!car) {
    return <Navigate to="/fleet" replace />;
  }

  const specs = [
    { label: "Seats", value: `${car.seats}`, icon: UsersRound },
    { label: "Fuel", value: car.fuelType, icon: Fuel },
    { label: "Transmission", value: car.transmission, icon: Gauge },
    { label: "Luggage", value: `${car.luggageCapacity} bags`, icon: Luggage }
  ];

  return <section className="bg-mist py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div className="grid gap-6">
          <Link to="/fleet" className="inline-flex items-center gap-2 text-sm font-bold text-teal">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Fleet
          </Link>
          <CarGallery car={car} />
          <AvailabilityCalendar car={car} />
        </div>

        <div className="grid content-start gap-6">
          <div className="rounded-md border border-line bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">{vehicleTypeLabels[car.type]}</p>
            <h1 className="mt-2 text-4xl font-black text-ink">{car.name}</h1>
            <p className="mt-4 text-base leading-7 text-graphite">{car.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {specs.map((spec) => <div key={spec.label} className="rounded-md border border-line bg-white p-4">
                  <spec.icon className="mb-3 h-5 w-5 text-teal" aria-hidden="true" />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-graphite">{spec.label}</p>
                  <p className="mt-1 text-lg font-black capitalize text-ink">{spec.value}</p>
                </div>)}
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-black text-ink">Features</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(car.features || []).map((feature) => <span key={feature} className="rounded-md bg-mist px-3 py-2 text-sm font-semibold text-graphite">
                    {feature}
                  </span>)}
              </div>
            </div>
          </div>

          <aside className="rounded-md border border-line bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-graphite">Daily rate</p>
                <p className="text-4xl font-black text-ink">{formatMoney(car.pricePerDay)}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md bg-basil/10 px-3 py-2 text-sm font-bold text-basil">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Available
              </span>
            </div>
            <Link to={`/book/${car.slug}`} className="mt-6 block">
              <Button className="w-full" leftIcon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}>
                Select dates
              </Button>
            </Link>
            <p className="mt-4 text-sm leading-6 text-graphite">
              A pending checkout temporarily blocks the selected dates. The booking is confirmed only after payment succeeds.
            </p>
          </aside>
        </div>
      </div>
    </section>;
}
export {
  CarDetailPage
};
