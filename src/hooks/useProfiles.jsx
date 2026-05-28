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
    
    if (path.startsWith('http') || path.startsWith('/images/')) return path;

    try {
      const { data, error } = await supabase.storage.from("customer-documents").createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error("Error signing URL:", err);
      return null;
    }
  }, []);

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
    getSignedDocumentUrl
  };
}
