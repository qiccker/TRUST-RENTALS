import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase/browser";
const STORAGE_KEY = "trust-rentals-user";
const AuthContext = createContext(null);
function demoUser(role) {
  return {
    id: role === "admin" ? "demo-admin" : "demo-customer",
    email: role === "admin" ? "admin@trustrentals.test" : "customer@trustrentals.test",
    fullName: role === "admin" ? "Admin Manager" : "Taylor Morgan",
    phone: "+1 555 0125",
    role
  };
}
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) {
        return;
      }
      if (!data.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name, phone, role, document_status, gov_id_url, driving_license_url").eq("id", data.user.id).single();
      setUser({
        id: data.user.id,
        email: data.user.email ?? "",
        fullName: profile?.full_name ?? data.user.email ?? "Customer",
        phone: profile?.phone ?? void 0,
        role: profile?.role ?? "customer",
        documentStatus: profile?.document_status ?? "unsubmitted",
        govIdUrl: profile?.gov_id_url ?? null,
        drivingLicenseUrl: profile?.driving_license_url ?? null
      });
      setIsLoading(false);
    }
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });
    void loadUser();
    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (user) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [user]);
  const value = useMemo(
    () => ({
      user,
      isLoading,
      isConfigured: isSupabaseConfigured,
      async signIn(email, password) {
        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            throw error;
          }
          return;
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        setUser({
          id: "demo-customer",
          email,
          fullName: email.split("@")[0] || "Customer",
          role: email.toLowerCase().includes("admin") ? "admin" : "customer"
        });
      },
      async signUp(fullName, email, password) {
        if (supabase) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName }
            }
          });
          if (error) {
            throw error;
          }
          return;
        }
        setUser({ id: "demo-customer", email, fullName, role: "customer" });
      },
      async signOut() {
        if (supabase) {
          await supabase.auth.signOut();
        }
        setUser(null);
      },
      useDemoAccount(role) {
        setUser(demoUser(role));
      }
    }),
    [isLoading, user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
export {
  AuthProvider,
  useAuth
};
