import { Mail, MapPin, Phone } from "lucide-react";
function Footer() {
  return <footer className="border-t border-line bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-black">TRUST RENTALS</p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Premium daily rentals with transparent pricing, protected checkout, and practical support.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-saffron" aria-hidden="true" />
            1200 Market Street, San Francisco
          </span>
          <span className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-saffron" aria-hidden="true" />
            +1 555 0100
          </span>
          <span className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-saffron" aria-hidden="true" />
            bookings@trustrentals.example
          </span>
        </div>
        <div className="text-sm text-white/70">
          <p className="font-semibold text-white">Hours</p>
          <p className="mt-2">Mon-Fri: 7:00 AM - 9:00 PM</p>
          <p>Sat-Sun: 8:00 AM - 8:00 PM</p>
        </div>
      </div>
    </footer>;
}
export {
  Footer
};
