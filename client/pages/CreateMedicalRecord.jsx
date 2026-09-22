
import { useState } from "react";
import { ArrowLeft, FilePlus2, Home, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL, getToken } from "@shared/api";

export default function CreateMedicalRecord() {
  const navigate = useNavigate();

  // Step control
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [problemLocation, setProblemLocation] = useState("");
  const [occurredBefore, setOccurredBefore] = useState("");

  // Step 2 fields
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [report, setReport] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Go from Step 1 to Step 2
  const handleNext = (event) => {
    event.preventDefault();

    if (!problemLocation.trim()) {
      toast.error("Please enter the exact location of the problem.");
      return;
    }

    if (!occurredBefore) {
      toast.error(
        "Please tell us whether this issue has occurred before."
      );
      return;
    }

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Submit complete medical record
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!symptoms.trim()) {
      toast.error("Please describe your main symptoms.");
      return;
    }

    if (!duration.trim()) {
      toast.error("Please enter the duration of your symptoms.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Step 1 information
      formData.append(
        "problem_location",
        problemLocation.trim()
      );

      formData.append(
        "occurred_before",
        occurredBefore
      );

      // Step 2 information
      formData.append(
        "symptoms",
        symptoms.trim()
      );

      formData.append(
        "duration",
        duration.trim()
      );

      // Optional PDF report
      if (report) {
        formData.append("report", report);
      }

      const response = await fetch(`${API_BASE_URL}/api/records`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not save your medical record."
        );
      }

      toast.success(
        "Medical record submitted to your doctor's queue."
      );

      navigate("/medical-records");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PDF upload validation
  const handleReportChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setReport(null);
      return;
    }

    // Allow PDF files only
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file only.");
      event.target.value = "";
      setReport(null);
      return;
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF file must be smaller than 10MB.");
      event.target.value = "";
      setReport(null);
      return;
    }

    setReport(file);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-2xl">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/medical-records"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Medical Records
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="mt-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <FilePlus2 className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Create Medical Record
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Describe your health concern so your doctor can
            review and prioritize it quickly.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              step === 1
                ? "bg-primary text-primary-foreground"
                : "bg-primary/15 text-primary"
            }`}
          >
            1
          </div>

          <div className="h-px w-16 bg-border" />

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              step === 2
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {step === 1
            ? "Basic Problem Information"
            : "Symptoms and Medical Report"}
        </p>

        {/* Form Card */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">

          {/* =====================================================
              STEP 1
              ===================================================== */}
          {step === 1 && (
            <form
              onSubmit={handleNext}
              className="space-y-6"
            >

              {/* Exact Location */}
              <div className="space-y-2">
                <Label htmlFor="problem-location">
                  Exact Location of the Problem
                </Label>

                <Input
                  id="problem-location"
                  type="text"
                  value={problemLocation}
                  onChange={(event) =>
                    setProblemLocation(event.target.value)
                  }
                  placeholder="e.g. left side of chest, right knee, lower abdomen"
                  required
                />

                <p className="text-xs text-muted-foreground">
                  Please mention the specific body area where
                  you are experiencing the problem.
                </p>
              </div>

              {/* Has occurred before */}
              <div className="space-y-3">
                <Label>
                  Has this issue occurred before?
                </Label>

                <div className="grid grid-cols-2 gap-3">

                  {/* YES */}
                  <button
                    type="button"
                    onClick={() =>
                      setOccurredBefore("yes")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      occurredBefore === "yes"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    Yes
                  </button>

                  {/* NO */}
                  <button
                    type="button"
                    onClick={() =>
                      setOccurredBefore("no")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      occurredBefore === "no"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    No
                  </button>

                </div>

                <p className="text-xs text-muted-foreground">
                  This information can help your doctor
                  understand whether the condition is recurring.
                </p>
              </div>

              {/* Continue */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
              >
                Continue
              </Button>

            </form>
          )}

          {/* =====================================================
              STEP 2
              ===================================================== */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Main Symptoms */}
              <div className="space-y-2">
                <Label htmlFor="main-symptoms">
                  Main Symptoms
                </Label>

                <textarea
                  id="main-symptoms"
                  value={symptoms}
                  onChange={(event) =>
                    setSymptoms(event.target.value)
                  }
                  placeholder="Describe your main symptoms in as much detail as you can"
                  className="flex min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              {/* Duration of Symptoms */}
              <div className="space-y-2">
                <Label htmlFor="symptom-duration">
                  Duration of Symptoms
                </Label>

                <Input
                  id="symptom-duration"
                  type="text"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  placeholder="e.g. 3 days, 2 weeks, since this morning"
                  required
                />
              </div>

              {/* Medical Report - Optional */}
              <div className="space-y-2">
                <Label htmlFor="medical-report">
                  Medical Report{" "}
                  <span className="text-muted-foreground">
                    (Optional)
                  </span>
                </Label>

                <div className="relative">
                  <Input
                    id="medical-report"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleReportChange}
                    className="cursor-pointer"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  PDF format only, up to 10MB. You can leave
                  this field empty.
                </p>

                {/* Selected File */}
                {report && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                    <Upload className="h-4 w-4 text-primary" />

                    <span className="truncate">
                      {report.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Back + Save Buttons */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting…"
                    : "Save Medical Record"}
                </Button>

              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}

