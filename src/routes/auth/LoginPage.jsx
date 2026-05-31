import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";
function LoginPage() {
  const { user, signIn, useDemoAccount, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = location.state?.from ?? "/fleet";
  if (user) {
    let dest = from;
    if (user.role === 'admin' || user.role === 'staff') {
      dest = from === '/fleet' ? '/admin' : from;
    } else if (dest.startsWith('/admin')) {
      dest = '/fleet';
    }
    return <Navigate to={dest} replace />;
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      // Note: the redirect will be handled by the user state change above
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <section className="bg-mist py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-md border border-line bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-80 bg-ink">
          <img className="absolute inset-0 h-full w-full object-cover" src="/images/fleet-hero.png" alt="" />
          <div className="absolute inset-0 bg-ink/70" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-saffron">TRUST RENTALS</p>
            <h1 className="mt-3 text-4xl font-black">Welcome back</h1>
            <p className="mt-3 text-sm leading-6 text-white/76">
              Access bookings, receipts, checkout status, and admin controls from one account.
            </p>
          </div>
        </div>

        <form className="grid gap-5 p-8" onSubmit={submit}>
          <div>
            <h2 className="text-3xl font-black text-ink">Sign in</h2>
          </div>

          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
  <Input
    label="Password"
    type="password"
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    required
  />
  <div className="flex justify-end -mt-3">
    <Link to="/reset-password" className="text-sm font-semibold text-teal hover:underline">
      Forgot password?
    </Link>
  </div>

  {error ? <p className="rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p> : null}

          <Button type="submit" isLoading={isSubmitting}>
            Sign in
          </Button>



          <p className="text-center text-sm text-graphite">
            New customer?{" "}
            <Link to="/register" className="font-bold text-teal">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </section>;
}
export {
  LoginPage
};
