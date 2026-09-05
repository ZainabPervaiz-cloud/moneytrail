import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password);
      navigate("/", { replace: true });
    } catch {
      setError("Could not create account — that email may already be registered.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
        Create your account
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6">
        Start tracking your income and expenses in minutes.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-4 py-3 outline-none focus:border-teal-600"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-neutral-300 dark:border-neutral-700 bg-transparent rounded-lg px-4 py-3 outline-none focus:border-teal-600"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-teal-600 text-white rounded-lg py-3 font-medium disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
