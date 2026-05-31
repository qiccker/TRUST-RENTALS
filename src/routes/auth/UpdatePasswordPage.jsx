import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { supabase } from "../../lib/supabase/browser";

function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If Supabase hasn't established a session from the hash yet, we wait.
    // AuthProvider typically handles establishing the session, but we just need
    // to ensure there's an active user.
    async function checkSession() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (!data.session && !window.location.hash.includes("access_token")) {
          // If no session and no access token in the URL, they shouldn't be here
          setError("You do not have permission to reset the password. Please request a new link.");
        }
      }
    }
    checkSession();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabase) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        });
        if (updateError) {
          throw updateError;
        }
      }
      setMessage("Password updated successfully!");
      
      // Navigate to login or home after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-mist py-16">
      <form className="mx-auto grid max-w-xl gap-5 rounded-md border border-line bg-white p-8 shadow-sm" onSubmit={submit}>
        <div>
          <h1 className="text-3xl font-black text-ink">Set new password</h1>
          <p className="mt-3 text-sm leading-6 text-graphite">
            Please enter your new password below.
          </p>
        </div>

        <Input 
          label="New Password" 
          type="password" 
          value={password} 
          onChange={(event) => setPassword(event.target.value)} 
          required 
        />
        
        <Input 
          label="Confirm Password" 
          type="password" 
          value={confirmPassword} 
          onChange={(event) => setConfirmPassword(event.target.value)} 
          required 
        />

        {message ? <p className="rounded-md bg-basil/10 px-3 py-2 text-sm font-semibold text-basil">{message}</p> : null}
        {error ? <p className="rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p> : null}
        
        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>

        <Link to="/login" className="text-center text-sm font-bold text-teal mt-4 hover:underline">
          Back to sign in
        </Link>
      </form>
    </section>
  );
}

export { UpdatePasswordPage };
