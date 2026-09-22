import { useState } from "react";
import { Eye, EyeOff, Home, ShieldCheck, Stethoscope } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setAuth } from "@shared/api";

export default function Registration({ role }) {
  const isDoctor = role === "doctor";
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [abhaNumber, setAbhaNumber] = useState("");
  const [username, setUsername] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isDoctor) {
        const { token, doctor } = await api.post("/auth/register/doctor", {
          name,
          licenseNumber,
          password,
        });
        setAuth(token, "doctor");
        toast.success("Account created! Let's finish setting up your profile.");
        navigate("/doctor-profile");
      } else {
        const { token, patient } = await api.post("/auth/register/patient", {
          name,
          abhaNumber,
          username,
          password,
        });
        setAuth(token, "patient");
        toast.success("Account created! Let's finish setting up your profile.");
        navigate("/user-profile");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:left-8 sm:top-8">
        <Home className="h-4 w-4" />
        Home
      </Link>
      <Link to={isDoctor ? "/doctor-login" : "/user-login"} className="absolute right-5 top-5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:right-8 sm:top-8">
        {isDoctor ? "Doctor Login" : "User Login"}
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            {isDoctor ? <Stethoscope className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {isDoctor ? "Doctor Registration" : "User Registration"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {isDoctor
              ? "Create your secure healthcare provider account"
              : "Create your secure ArogyaAI account"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isDoctor ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registration-name">Name</Label>
                  <Input
                    id="registration-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-license">License No.</Label>
                  <Input
                    id="registration-license"
                    type="text"
                    placeholder="Enter your license number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registration-name">Name</Label>
                  <Input
                    id="registration-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-abha">ABHA No.</Label>
                  <Input
                    id="registration-abha"
                    type="text"
                    inputMode="numeric"
                    placeholder="XX-XXXX-XXXX-XXXX"
                    value={abhaNumber}
                    onChange={(e) => setAbhaNumber(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-username">Username</Label>
                  <Input
                    id="registration-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="registration-password">Password</Label>
              <div className="relative">
                <Input
                  id="registration-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="registration-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pr-10"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
