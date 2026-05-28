import { useState } from "react";
function CarGallery({ car }) {
  const [activeImage, setActiveImage] = useState(car.images[0]);
  return <section className="grid gap-3">
      <div className="aspect-[16/10] overflow-hidden rounded-md bg-mist">
        <img className="h-full w-full object-cover" src={activeImage} alt={`${car.name} exterior`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {car.images.map((image, index) => <button
    key={image}
    className={`aspect-[4/3] overflow-hidden rounded-md border transition ${activeImage === image ? "border-teal ring-2 ring-teal/20" : "border-line"}`}
    onClick={() => setActiveImage(image)}
    aria-label={`Show ${car.name} photo ${index + 1}`}
  >
            <img className="h-full w-full object-cover" src={image} alt="" />
          </button>)}
      </div>
    </section>;
}
export {
  CarGallery
};
