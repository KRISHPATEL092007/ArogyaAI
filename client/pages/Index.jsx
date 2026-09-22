import { useState } from "react";
import { Eye, EyeOff, Home, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setAuth } from "@shared/api";

export default function Index() {
  const navigate = useNavigate();

  const [abhaNumber, setAbhaNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { token, patient } = await api.post("/auth/login/patient", {
        abhaNumber,
        username,
        password,
      });

      setAuth(token, "patient");
      toast.success(`Welcome back, ${patient.name || patient.username}!`);
      navigate(patient.profile_completed ? "/user-home" : "/user-profile");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex items-center justify-center px-4 py-12">

      {/* Home Button */}
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:left-8 sm:top-8"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-foreground tracking-tight">
            User Login
          </h1>

          <p className="mt-1 text-sm text-muted-foreground text-center">
            Sign in with your Ayushman Bharat Health Account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ABHA Number */}
            <div className="space-y-2">
              <Label htmlFor="abha-number">
                ABHA No.
              </Label>

              <Input
                id="abha-number"
                type="text"
                inputMode="numeric"
                placeholder="XX-XXXX-XXXX-XXXX"
                value={abhaNumber}
                onChange={(e) => setAbhaNumber(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">
                Username
              </Label>

              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </Button>

          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register/user" className="font-medium text-primary hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
}
