import { CarFront, Edit2, ImagePlus, Plus, ToggleLeft, ToggleRight, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Field";
import { vehicleTypeLabels } from "../../data/fleet";
import { useCars } from "../../hooks/useCars";
import { formatMoney } from "../../lib/money";

const emptyCarForm = {
  name: "",
  type: "sedan",
  seats: 5,
  pricePerDay: 0,
  description: "",
  transmission: "automatic",
  fuelType: "Gasoline",
  luggageCapacity: 2,
  features: []
};

export function AdminCarsPage() {
  const { cars, fetchCars, addCar, updateCar, deleteCar, uploadCarImage, deleteCarImage, isLoading } = useCars();
  const [editingCar, setEditingCar] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(emptyCarForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [featuresText, setFeaturesText] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCars(true);
  }, [fetchCars]);

  // When editing, populate form
  useEffect(() => {
    if (editingCar) {
      setFormData({
        name: editingCar.name || "",
        type: editingCar.type || "sedan",
        seats: editingCar.seats || 5,
        pricePerDay: editingCar.pricePerDay || 0,
        description: editingCar.description || "",
        transmission: editingCar.transmission || "automatic",
        fuelType: editingCar.fuelType || editingCar.fuel_type || "Gasoline",
        luggageCapacity: editingCar.luggageCapacity || 2,
        features: editingCar.features || []
      });
      setFeaturesText((editingCar.features || []).join(", "));
    }
  }, [editingCar]);

  const openAddForm = () => {
    setEditingCar(null);
    setFormData(emptyCarForm);
    setFeaturesText("");
    setIsAdding(true);
  };

  const closeForm = () => {
    setEditingCar(null);
    setIsAdding(false);
    setFormData(emptyCarForm);
    setFeaturesText("");
  };

  const openEditForm = (car) => {
    setIsAdding(false);
    setEditingCar(car);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeaturesChange = (text) => {
    setFeaturesText(text);
    setFormData(prev => ({
      ...prev,
      features: text.split(",").map(f => f.trim()).filter(Boolean)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (isAdding) {
      const newCar = await addCar(formData);
      setIsSaving(false);
      if (newCar) {
        // After adding, switch to edit mode so admin can upload photos
        await fetchCars(true);
        const refreshedCar = cars.find(c => c.id === newCar.id);
        setIsAdding(false);
        setEditingCar(refreshedCar || { ...newCar, images: [], imagesRaw: [], pricePerDay: formData.pricePerDay, fuelType: formData.fuelType, luggageCapacity: formData.luggageCapacity, isAvailable: true });
      } else {
        closeForm();
      }
    } else if (editingCar) {
      await updateCar(editingCar.id, formData);
      setIsSaving(false);
      closeForm();
      fetchCars(true);
    }
  };

  const handleDelete = async (car) => {
    if (!confirm(`Are you sure you want to permanently delete "${car.name}"? This action cannot be undone.`)) return;
    await deleteCar(car.id);
    if (editingCar?.id === car.id) closeForm();
  };

  const handleImageUpload = async (e) => {
    if (!editingCar || !e.target.files?.length) return;
    const file = e.target.files[0];
    setIsUploading(true);
    const newUrl = await uploadCarImage(editingCar.id, file);
    if (newUrl) {
      fetchCars(true);
      setEditingCar(prev => ({
        ...prev,
        images: [...(prev.images || []), newUrl]
      }));
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const handleImageDelete = async (img) => {
    if (!editingCar) return;
    const rawImg = editingCar.imagesRaw?.find(r => r.url === img);
    if (rawImg) {
      const ok = await deleteCarImage(rawImg.id, rawImg.storage_path);
      if (ok) {
        setEditingCar(prev => ({
          ...prev,
          images: prev.images.filter(u => u !== img),
          imagesRaw: prev.imagesRaw.filter(r => r.id !== rawImg.id)
        }));
      }
    }
  };

  const showForm = isAdding || editingCar;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[rgb(59_130_246_/_0.5)]">Fleet management</p>
          <h1 className="mt-2 text-[28px] font-extrabold text-[#1e293b]">Cars</h1>
        </div>
        <Button onClick={openAddForm} leftIcon={<Plus className="h-4 w-4" />}>Add Car</Button>
      </div>

      <div className={`grid gap-6 ${showForm ? 'xl:grid-cols-[1fr_420px]' : ''}`}>
        {/* Cars Table */}
        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm self-start">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs uppercase tracking-wider text-[#94a3b8]">
                <tr>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Seats</th>
                  <th className="px-5 py-4">Price/day</th>
                  <th className="px-5 py-4">Photos</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={isLoading && !cars.length ? "opacity-50" : ""}>
                {cars.map((car) => (
                  <tr key={car.id} className={`border-b border-[#f1f5f9] transition ${editingCar?.id === car.id ? 'bg-[rgb(59_130_246_/_0.5)]/5' : 'hover:bg-[#f8fafc]'}`}>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-3">
                        {car.images?.[0] ? (
                          <img className="h-10 w-14 rounded-lg object-cover border border-[#e2e8f0]" src={car.images[0]} alt="" />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-[#f1f5f9] flex items-center justify-center border border-[#e2e8f0]">
                            <CarFront className="h-4 w-4 text-[#94a3b8]" />
                          </div>
                        )}
                        <span className="font-bold text-[#1e293b]">{car.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#64748b]">{vehicleTypeLabels[car.type] || car.type}</td>
                    <td className="px-5 py-4 text-[#64748b]">{car.seats}</td>
                    <td className="px-5 py-4 font-bold text-[#1e293b]">{formatMoney(car.pricePerDay)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        (car.images?.length || 0) > 0 ? 'text-[rgb(59_130_246_/_0.5)]' : 'text-[#f59e0b]'
                      }`}>
                        <ImagePlus className="h-3.5 w-3.5" />
                        {car.images?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${car.isAvailable !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${car.isAvailable !== false ? "bg-green-500" : "bg-red-500"}`} />
                        {car.isAvailable !== false ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition"
                          onClick={() => updateCar(car.id, { isAvailable: car.isAvailable === false })}
                          title={car.isAvailable !== false ? "Mark unavailable" : "Mark available"}
                        >
                          {car.isAvailable !== false ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[rgb(59_130_246_/_0.5)]/10 hover:text-[rgb(59_130_246_/_0.5)] transition"
                          onClick={() => openEditForm(car)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-red-50 hover:text-red-600 transition"
                          onClick={() => handleDelete(car)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cars.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-[#94a3b8]">
                      <CarFront className="mx-auto h-8 w-8 mb-2 text-[#cbd5e1]" />
                      No cars in fleet yet. Click "Add Car" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add / Edit Form Panel */}
        {showForm && (
          <aside className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm sticky top-8 self-start">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 mb-4">
              <h2 className="text-lg font-extrabold text-[#1e293b]">
                {isAdding ? "Add New Car" : `Edit: ${editingCar?.name}`}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1 hover:bg-[#f1f5f9] transition">
                <X className="h-4 w-4 text-[#94a3b8]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid gap-4">
              <Input 
                label="Car Name" 
                value={formData.name} 
                onChange={(e) => handleFormChange("name", e.target.value)} 
                placeholder="e.g. Maruti Suzuki Swift"
                required 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Type"
                  value={formData.type}
                  onChange={(e) => handleFormChange("type", e.target.value)}
                >
                  {Object.entries(vehicleTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </Select>
                <Input 
                  label="Price/day (₹)" 
                  type="number"
                  min="1"
                  value={formData.pricePerDay} 
                  onChange={(e) => handleFormChange("pricePerDay", Number(e.target.value))} 
                  required 
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input 
                  label="Seats" 
                  type="number"
                  min="1" max="20"
                  value={formData.seats} 
                  onChange={(e) => handleFormChange("seats", Number(e.target.value))} 
                  required 
                />
                <Select
                  label="Transmission"
                  value={formData.transmission}
                  onChange={(e) => handleFormChange("transmission", e.target.value)}
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </Select>
                <Input 
                  label="Luggage" 
                  type="number"
                  min="0" max="20"
                  value={formData.luggageCapacity} 
                  onChange={(e) => handleFormChange("luggageCapacity", Number(e.target.value))} 
                />
              </div>

              <Input 
                label="Fuel Type" 
                value={formData.fuelType} 
                onChange={(e) => handleFormChange("fuelType", e.target.value)} 
                placeholder="e.g. Petrol, Diesel, CNG, Electric"
              />

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Brief description of the car..."
                required
              />

              <Input 
                label="Features (comma separated)" 
                value={featuresText} 
                onChange={(e) => handleFeaturesChange(e.target.value)} 
                placeholder="e.g. AC, GPS, Bluetooth, Airbags"
              />

              {/* Photo management — available when editing */}
              {editingCar && (
                <div className="border-t border-[#e2e8f0] pt-4 mt-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-[#1e293b]">
                      Photos ({editingCar.images?.length || 0})
                    </p>
                    <label className={`inline-flex items-center gap-1.5 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold bg-[rgb(59_130_246_/_0.5)]/10 text-[rgb(59_130_246_/_0.5)] hover:bg-[rgb(59_130_246_/_0.5)]/20 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="h-3.5 w-3.5" />
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                  </div>

                  {(editingCar.images?.length || 0) > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {editingCar.images.map((url, i) => (
                        <div key={i} className="relative group aspect-[3/2] rounded-lg overflow-hidden border border-[#e2e8f0]">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleImageDelete(url)}
                              className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-[#e2e8f0] py-6 text-center">
                      <ImagePlus className="mx-auto h-8 w-8 text-[#cbd5e1] mb-2" />
                      <p className="text-xs text-[#94a3b8]">No photos yet — click "Upload Photo" above</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt to save first if adding */}
              {isAdding && (
                <div className="rounded-lg bg-[rgb(59_130_246_/_0.5)]/5 border border-[rgb(59_130_246_/_0.5)]/20 p-3">
                  <p className="text-xs text-[rgb(59_130_246_/_0.5)] font-semibold">
                    💡 Save the car first, then you can upload photos in edit mode.
                  </p>
                </div>
              )}

              <div className="border-t border-[#e2e8f0] pt-4 mt-1 flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>
                  {isAdding ? "Save & Add Photos" : "Save Changes"}
                </Button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
