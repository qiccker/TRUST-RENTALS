import { useCallback, useState } from "react";
import { fleet as mockFleet } from "../data/fleet";
import { isSupabaseConfigured, supabase } from "../lib/supabase/browser";

export function useCars() {
  const [cars, setCars] = useState(isSupabaseConfigured ? [] : mockFleet);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCars = useCallback(async (includeUnavailable = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsLoading(true);
    try {
      let query = supabase.from("cars").select(`
        *,
        car_images (
          id,
          url,
          storage_path,
          is_primary,
          sort_order
        )
      `).order('created_at', { ascending: false });

      if (!includeUnavailable) {
        query = query.eq('is_available', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const formattedCars = data.map(car => ({
        ...car,
        pricePerDay: Number(car.price_per_day),
        fuelType: car.fuel_type,
        luggageCapacity: car.luggage_capacity,
        isAvailable: car.is_available,
        images: car.car_images 
          ? car.car_images.sort((a, b) => a.sort_order - b.sort_order).map(img => img.url)
          : [],
        imagesRaw: car.car_images || []
      }));
      
      setCars(formattedCars);
    } catch (err) {
      console.error("Error fetching cars:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCar = useCallback(async (carData) => {
    if (!isSupabaseConfigured || !supabase) {
      const newCar = {
        id: crypto.randomUUID(),
        ...carData,
        isAvailable: true,
        images: [],
        created_at: new Date().toISOString()
      };
      setCars(current => [newCar, ...current]);
      return newCar;
    }

    // Generate slug from name
    const slug = carData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const dbData = {
      name: carData.name,
      slug: slug + '-' + Date.now(),
      type: carData.type,
      seats: Number(carData.seats),
      price_per_day: Number(carData.pricePerDay),
      description: carData.description || '',
      transmission: carData.transmission || 'automatic',
      fuel_type: carData.fuelType || null,
      luggage_capacity: carData.luggageCapacity ? Number(carData.luggageCapacity) : null,
      features: carData.features || [],
      is_available: true
    };

    const { data, error } = await supabase.from("cars").insert(dbData).select().single();
    if (error) {
      console.error("Error adding car:", error);
      return null;
    }
    
    // Re-fetch to get images joined
    await fetchCars(true);
    return data;
  }, [fetchCars]);

  const updateCar = useCallback(async (id, updates) => {
    if (!isSupabaseConfigured || !supabase) {
      setCars(current => current.map(c => c.id === id ? { ...c, ...updates } : c));
      return;
    }
    
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
    if (updates.pricePerDay !== undefined) dbUpdates.price_per_day = updates.pricePerDay;
    if (updates.fuelType !== undefined) dbUpdates.fuel_type = updates.fuelType;
    if (updates.seats !== undefined) dbUpdates.seats = updates.seats;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.transmission !== undefined) dbUpdates.transmission = updates.transmission;
    if (updates.luggageCapacity !== undefined) dbUpdates.luggage_capacity = updates.luggageCapacity;
    if (updates.features !== undefined) dbUpdates.features = updates.features;

    const { error } = await supabase.from("cars").update(dbUpdates).eq("id", id);
    if (!error) {
      setCars(current => current.map(c => c.id === id ? { ...c, ...updates } : c));
    } else {
      console.error("Error updating car:", error);
    }
  }, []);

  const deleteCar = useCallback(async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setCars(current => current.filter(c => c.id !== id));
      return true;
    }

    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (!error) {
      setCars(current => current.filter(c => c.id !== id));
      return true;
    } else {
      console.error("Error deleting car:", error);
      return false;
    }
  }, []);
  
  const uploadCarImage = useCallback(async (carId, file) => {
    if (!isSupabaseConfigured || !supabase) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${carId}/${Date.now()}.${fileExt}`;
    
    try {
      const { error: uploadError } = await supabase.storage.from('car-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('car-images').getPublicUrl(fileName);
      
      // Count existing images to set sort order
      const { count } = await supabase.from('car_images').select('*', { count: 'exact', head: true }).eq('car_id', carId);

      const { error: dbError } = await supabase.from('car_images').insert({
        car_id: carId,
        url: publicUrl,
        storage_path: fileName,
        is_primary: (count || 0) === 0,
        sort_order: count || 0
      });
      
      if (dbError) throw dbError;
      
      return publicUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      return null;
    }
  }, []);

  const deleteCarImage = useCallback(async (imageId, storagePath) => {
    if (!isSupabaseConfigured || !supabase) return false;

    try {
      if (storagePath) {
        await supabase.storage.from('car-images').remove([storagePath]);
      }
      const { error } = await supabase.from('car_images').delete().eq('id', imageId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Error deleting image:", err);
      return false;
    }
  }, []);

  return {
    cars,
    isLoading,
    fetchCars,
    addCar,
    updateCar,
    deleteCar,
    uploadCarImage,
    deleteCarImage
  };
}
