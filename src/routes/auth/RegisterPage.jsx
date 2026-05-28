import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";
function RegisterPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (user) {
    return <Navigate to="/fleet" replace />;
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signUp(fullName, email, password);
      navigate("/fleet", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <section className="bg-mist py-16">
      <form className="mx-auto grid max-w-xl gap-5 rounded-md border border-line bg-white p-8 shadow-sm" onSubmit={submit}>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal">TRUST RENTALS</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Create account</h1>
        </div>

        <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input
    label="Password"
    type="password"
    minLength={6}
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    required
  />

        {error ? <p className="rounded-md bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">{error}</p> : null}

        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>

        <p className="text-center text-sm text-graphite">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-teal">
            Sign in
          </Link>
        </p>
      </form>
    </section>;
}
export {
  RegisterPage
};
