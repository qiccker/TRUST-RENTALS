const fleet = [];

const vehicleTypeLabels = {
  sedan: "Sedan",
  suv: "SUV",
  hatchback: "Hatchback",
  van: "Van",
  truck: "Truck",
  luxury: "Luxury",
  convertible: "Convertible",
  ev: "EV"
};

function getCarBySlug(slug) {
  return fleet.find((car) => car.slug === slug);
}

export {
  fleet,
  getCarBySlug,
  vehicleTypeLabels
};
