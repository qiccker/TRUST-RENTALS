import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { supabase } from "../../lib/supabase/browser";
function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);
    try {
      if (supabase) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`
        });
        if (resetError) {
          throw resetError;
        }
      }
      setMessage("Password reset email sent.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <section className="bg-mist py-16">
      <form className="mx-auto grid max-w-xl gap-5 rounded-md border border-line bg-white p-8 shadow-sm" onSubmit={submit}>
        <div>
          <h1 className="text-3xl font-black text-ink">Password reset</h1>
          <p className="mt-3 text-sm leading-6 text-graphite">
            Enter the email address for your TRUST RENTALS account.
          </p>
        </div>
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {message ? <p className="rounded-md bg-basil/10 px-3 py-2 text-sm font-semibold text-basil">{message}</p> : null}
        {error ? <p className="rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p> : null}
        <Button type="submit" isLoading={isSubmitting}>
          Send reset email
        </Button>
        <Link to="/login" className="text-center text-sm font-bold text-teal">
          <Button>Back to sign in</Button>
        </Link>
      </form>
    </section>;
}
export {
  ResetPasswordPage
};
