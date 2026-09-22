
import { useEffect, useState } from "react";
import { Home, Stethoscope } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getRole, getToken } from "@shared/api";

export default function DoctorProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [workplaceAddress, setWorkplaceAddress] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Make sure the doctor is actually authenticated.
    if (!getToken() || getRole() !== "doctor") {
      navigate("/doctor-login", { replace: true });
      return;
    }

    let isMounted = true;

    const loadDoctorProfile = async () => {
      try {
        const { doctor } = await api.get("/doctors/me");

        if (!isMounted) return;

        setName(doctor?.name || "");
        setLicenseNumber(doctor?.license_number || "");
        setQualifications(doctor?.qualifications || "");
        setWorkplace(doctor?.workplace || "");
        setWorkplaceAddress(doctor?.workplace_address || "");
      } catch (error) {
        if (!isMounted) return;

        toast.error(error.message || "Unable to load doctor profile.");
        navigate("/doctor-login", { replace: true });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDoctorProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!licenseNumber.trim()) {
      toast.error("Please enter your license number.");
      return;
    }

    if (!qualifications.trim()) {
      toast.error("Please enter your qualifications.");
      return;
    }

    if (!workplace.trim()) {
      toast.error("Please enter your hospital or clinic.");
      return;
    }

    if (!workplaceAddress.trim()) {
      toast.error("Please enter your hospital or clinic address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.put("/doctors/me", {
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        qualifications: qualifications.trim(),
        workplace: workplace.trim(),
        workplaceAddress: workplaceAddress.trim(),
      });

      // Backend must return the updated doctor.
      if (!response?.doctor) {
        throw new Error("Doctor profile was not saved correctly.");
      }

      toast.success("Doctor profile saved successfully!");

      /*
       * Use replace so the browser does not keep the incomplete
       * profile page in the navigation history.
       */
      navigate("/doctor-home", { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to save doctor profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <Link
        to="/"
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent sm:left-8 sm:top-8"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>

      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Complete Your Doctor Profile
          </h1>

          <p className="mt-1 text-center text-sm text-muted-foreground">
            Add your professional details to build your verified provider profile
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">
              Loading your profile…
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-5 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="doctor-profile-name">
                  Name
                </Label>

                <Input
                  id="doctor-profile-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-profile-license">
                  License No.
                </Label>

                <Input
                  id="doctor-profile-license"
                  type="text"
                  placeholder="Enter your license number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-profile-qualifications">
                  Qualifications
                </Label>

                <Input
                  id="doctor-profile-qualifications"
                  type="text"
                  placeholder="e.g. MBBS, MD"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="doctor-profile-workplace">
                  Current Hospital/Clinic
                </Label>

                <Input
                  id="doctor-profile-workplace"
                  type="text"
                  placeholder="Enter your current hospital or clinic"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="doctor-profile-address">
                  Hospital/Clinic Address
                </Label>

                <textarea
                  id="doctor-profile-address"
                  placeholder="Enter the complete hospital or clinic address"
                  value={workplaceAddress}
                  onChange={(e) => setWorkplaceAddress(e.target.value)}
                  className="flex min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving…"
                    : "Save Doctor Profile"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

