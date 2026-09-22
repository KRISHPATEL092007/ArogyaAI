import { useEffect, useState } from "react";
import { Home, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@shared/api";

export default function UserProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/patients/me")
      .then(({ patient }) => {
        if (!isMounted) return;
        setName(patient.name || "");
        setPhone(patient.phone || "");
        setEmail(patient.email || "");
        setDateOfBirth(patient.date_of_birth || "");
        setGender(patient.gender || "");
        setMedicalHistory(patient.medical_history || "");
        setAddress(patient.address || "");
        setCity(patient.city || "");
        setState(patient.state || "");
        setPincode(patient.pincode || "");
      })
      .catch((error) => {
        toast.error(error.message);
        navigate("/user-login");
      })
      .finally(() => isMounted && setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.put("/patients/me", {
        name,
        phone,
        email,
        date_of_birth: dateOfBirth,
        gender,
        medical_history: medicalHistory,
        address,
        state,
        city,
        pincode,
      });

      toast.success("Profile saved!");
      navigate("/user-home");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">

      {/* Home Button */}
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:left-8 sm:top-8"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <UserRound className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </h1>

          <p className="mt-1 text-center text-sm text-muted-foreground">
            Add your details to personalize your ArogyaAI experience
          </p>

        </div>

        {/* Profile Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">

          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading your profile…</p>
          ) : (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 sm:grid-cols-2"
          >

            {/* Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-name">
                Name
              </Label>

              <Input
                id="profile-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="profile-phone">
                Phone No.
              </Label>

              <Input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="profile-email">
                Email
              </Label>

              <Input
                id="profile-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date-of-birth">
                Date of Birth
              </Label>

              <Input
                id="date-of-birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender
              </Label>

              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            {/* Medical History */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="medical-history">
                Medical History
              </Label>

              <textarea
                id="medical-history"
                placeholder="Share any relevant medical history"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="flex min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">
                Address
              </Label>

              <textarea
                id="address"
                placeholder="Enter your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* State - LEFT */}
            <div className="space-y-2">
              <Label htmlFor="profile-state">
                State
              </Label>

              <Input
                id="profile-state"
                type="text"
                placeholder="Enter your state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                autoComplete="address-level1"
                required
              />
            </div>

            {/* City - RIGHT */}
            <div className="space-y-2">
              <Label htmlFor="profile-city">
                City
              </Label>

              <Input
                id="profile-city"
                type="text"
                placeholder="Enter your city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="profile-pincode">
                Pincode
              </Label>

              <Input
                id="profile-pincode"
                type="text"
                inputMode="numeric"
                placeholder="Enter your pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                autoComplete="postal-code"
                required
              />
            </div>

            {/* Save Profile Button */}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Save Profile"}
              </Button>
            </div>

          </form>
          )}

        </div>
      </div>
    </div>
  );
}
