
import { useState } from "react";
import { Eye, EyeOff, Home, Stethoscope } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setAuth } from "@shared/api";

export default function DoctorLogin() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !licenseNumber.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login/doctor", {
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        password,
      });

      const { token, doctor } = response;

      if (!token || !doctor) {
        throw new Error("Invalid login response from server.");
      }

      // Save doctor authentication.
      setAuth(token, "doctor");

      toast.success(`Welcome back, Dr. ${doctor.name}!`);

      /*
       * SQLite returns profile_completed as 0 or 1.
       * Convert it explicitly to a boolean.
       */
      const profileCompleted =
        doctor.profile_completed === 1 ||
        doctor.profile_completed === true ||
        doctor.profile_completed === "1";

      if (profileCompleted) {
        navigate("/doctor-home", { replace: true });
      } else {
        navigate("/doctor-profile", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.message || "Unable to login. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background flex items-center justify-center px-4 py-12">
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:left-8 sm:top-8"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Doctor Login
          </h1>

          <p className="mt-1 text-center text-sm text-muted-foreground">
            Sign in to manage your patient care securely
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="doctor-name">
                Name
              </Label>

              <Input
                id="doctor-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-number">
                License No.
              </Label>

              <Input
                id="license-number"
                type="text"
                placeholder="Enter your license number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor-password">
                Password
              </Label>

              <div className="relative">
                <Input
                  id="doctor-password"
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
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register/doctor"
            className="font-medium text-primary hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

