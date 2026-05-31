import { useCallback, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase/browser";
import { useAuth } from "./useAuth";

const mockProfiles = [
  { id: "demo-customer", full_name: "Maya Patel", phone: "+91 98765 43210", role: "customer", document_status: "pending", gov_id_url: "/images/mock-doc.png", driving_license_url: "/images/mock-doc.png" },
  { id: "demo-customer-2", full_name: "Jordan Lee", phone: "+91 87654 32109", role: "customer", document_status: "verified" },
  { id: "demo-admin", full_name: "Admin Manager", phone: "+91 99999 00000", role: "admin", document_status: "verified" }
];

export function useProfiles() {
  const [profiles, setProfiles] = useState(isSupabaseConfigured ? [] : mockProfiles);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (id, updates) => {
    if (!isSupabaseConfigured || !supabase) {
      setProfiles((current) => current.map((p) => p.id === id ? { ...p, ...updates } : p));
      return true;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (!error) {
      setProfiles((current) => current.map((p) => p.id === id ? { ...p, ...updates } : p));
      return true;
    }
    console.error("Error updating profile:", error);
    return false;
  }, []);

  const updateProfileRole = useCallback(async (id, role) => {
    return updateProfile(id, { role });
  }, [updateProfile]);

  const updateDocumentStatus = useCallback(async (id, status) => {
    return updateProfile(id, { document_status: status });
  }, [updateProfile]);

  const deleteProfile = useCallback(async (id) => {
    if (!isSupabaseConfigured || !supabase) {
      setProfiles((current) => current.filter((p) => p.id !== id));
      return true;
    }
    // Note: Deleting a profile requires deleting the auth user first (service_role)
    // From the client we can only remove from profiles table if RLS allows
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (!error) {
      setProfiles((current) => current.filter((p) => p.id !== id));
      return true;
    }
    console.error("Error deleting profile:", error);
    return false;
  }, []);

  const getSignedDocumentUrl = useCallback(async (path) => {
    if (!isSupabaseConfigured || !supabase || !path) return path;
    
    // Ignore static mock images
    if (path.startsWith('/images/')) return path;

    let storagePath = path;
    
    // If the database previously saved the full public URL, we must extract just the storage path
    if (path.startsWith('http')) {
       try {
         const url = new URL(path);
         // Format is usually /storage/v1/object/public/customer-documents/uuid/filename.jpg
         const parts = url.pathname.split('customer-documents/');
         if (parts.length > 1) {
           storagePath = parts[1]; 
         }
       } catch (e) {
         return path;
       }
    }

    try {
      // customer-documents is a private bucket, so we MUST generate a signed URL
      const { data, error } = await supabase.storage.from("customer-documents").createSignedUrl(storagePath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error("Error signing URL:", err);
      return null;
    }
  }, []);

  const fetchPaginatedProfiles = useCallback(async (roleFilter, page = 1, pageSize = 10) => {
    if (!isSupabaseConfigured || !supabase || !user) return { data: [], count: 0 };
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("profiles").select("*", { count: 'exact' }).order("created_at", { ascending: false }).range(from, to);
    
    if (roleFilter === 'customer') {
      query = query.eq('role', 'customer');
    } else if (roleFilter === 'staff') {
      query = query.in('role', ['staff', 'admin']);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("Error fetching paginated profiles:", error);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  }, [user]);

  return {
    profiles,
    customers: profiles.filter(p => p.role === 'customer'),
    staff: profiles.filter(p => p.role === 'staff' || p.role === 'admin'),
    isLoading,
    fetchProfiles,
    updateProfile,
    updateProfileRole,
    updateDocumentStatus,
    deleteProfile,
    getSignedDocumentUrl,
    fetchPaginatedProfiles
  };
}
