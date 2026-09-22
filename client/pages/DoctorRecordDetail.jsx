
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Activity,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";


// ============================================================
// BACKEND URL
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `http://${window.location.hostname}:5000`;


// ============================================================
// GET DOCTOR AUTH TOKEN
// ============================================================

const getToken = () => {
  const possibleKeys = [
    "token",
    "access_token",
    "accessToken",
    "jwt",
    "authToken",
    "auth_token",
    "doctor_token",
    "doctorToken",
    "arogya_token",
    "arogyaToken",
    "auth",
    "doctorAuth",
    "user",
    "doctor",
  ];


  // ----------------------------------------------------------
  // Search localStorage
  // ----------------------------------------------------------

  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);

    if (!value) {
      continue;
    }

    const cleanValue = value.trim();

    if (!cleanValue) {
      continue;
    }


    // Direct JWT
    if (
      cleanValue.split(".").length === 3
    ) {
      return cleanValue.replace(
        /^Bearer\s+/i,
        ""
      );
    }


    // Bearer token
    if (
      cleanValue
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return cleanValue
        .replace(/^Bearer\s+/i, "")
        .trim();
    }


    // JSON object
    try {
      const parsed = JSON.parse(cleanValue);

      if (parsed && typeof parsed === "object") {
        const possibleToken =
          parsed.token ||
          parsed.access_token ||
          parsed.accessToken ||
          parsed.jwt ||
          parsed.authToken;

        if (
          possibleToken &&
          typeof possibleToken === "string"
        ) {
          return possibleToken
            .replace(/^Bearer\s+/i, "")
            .trim();
        }
      }
    } catch {
      // Not JSON.
    }
  }


  // ----------------------------------------------------------
  // Search sessionStorage
  // ----------------------------------------------------------

  for (const key of possibleKeys) {
    const value =
      sessionStorage.getItem(key);

    if (!value) {
      continue;
    }

    const cleanValue = value.trim();

    if (!cleanValue) {
      continue;
    }


    // Direct JWT
    if (
      cleanValue.split(".").length === 3
    ) {
      return cleanValue.replace(
        /^Bearer\s+/i,
        ""
      );
    }


    // Bearer token
    if (
      cleanValue
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return cleanValue
        .replace(/^Bearer\s+/i, "")
        .trim();
    }


    // JSON object
    try {
      const parsed = JSON.parse(cleanValue);

      if (parsed && typeof parsed === "object") {
        const possibleToken =
          parsed.token ||
          parsed.access_token ||
          parsed.accessToken ||
          parsed.jwt ||
          parsed.authToken;

        if (
          possibleToken &&
          typeof possibleToken === "string"
        ) {
          return possibleToken
            .replace(/^Bearer\s+/i, "")
            .trim();
        }
      }
    } catch {
      // Not JSON.
    }
  }


  // ----------------------------------------------------------
  // Last fallback:
  // Search every localStorage value for JWT
  // ----------------------------------------------------------

  for (
    let i = 0;
    i < localStorage.length;
    i++
  ) {
    const key = localStorage.key(i);

    if (!key) {
      continue;
    }

    const value =
      localStorage.getItem(key);

    if (!value) {
      continue;
    }

    const cleanValue = value
      .trim()
      .replace(/^Bearer\s+/i, "");

    if (
      cleanValue.split(".").length === 3
    ) {
      return cleanValue;
    }


    // Try JSON
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        const possibleToken =
          parsed.token ||
          parsed.access_token ||
          parsed.accessToken ||
          parsed.jwt ||
          parsed.authToken;

        if (
          possibleToken &&
          typeof possibleToken === "string"
        ) {
          return possibleToken
            .replace(/^Bearer\s+/i, "")
            .trim();
        }
      }
    } catch {
      // Ignore invalid JSON.
    }
  }


  return "";
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DoctorRecordDetail() {
  const { id } = useParams();

  const navigate = useNavigate();


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [record, setRecord] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [diagnosis, setDiagnosis] =
    useState("");

  const [doctorNotes, setDoctorNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [generatingPdf, setGeneratingPdf] =
    useState(false);


  // ==========================================================
  // LOAD PATIENT RECORD
  // ==========================================================

  useEffect(() => {
    const loadRecord = async () => {
      try {
        setLoading(true);


        // ----------------------------------------------------
        // Get token
        // ----------------------------------------------------

        const token = getToken();

        console.log(
          "Doctor token found:",
          Boolean(token)
        );


        // ----------------------------------------------------
        // No token
        // ----------------------------------------------------

        if (!token) {
          toast.error(
            "Please sign in to continue."
          );

          navigate(
            "/doctor-login",
            {
              replace: true,
            }
          );

          return;
        }


        // ----------------------------------------------------
        // Request patient record
        // ----------------------------------------------------

        const response = await fetch(
          `${API_BASE_URL}/api/records/${id}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },
          }
        );


        // ----------------------------------------------------
        // Read response
        // ----------------------------------------------------

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }


        console.log(
          "Patient record response:",
          data
        );


        // ----------------------------------------------------
        // Unauthorized
        // ----------------------------------------------------

        if (response.status === 401) {
          toast.error(
            "Doctor session expired. Please login again."
          );

          navigate(
            "/doctor-login",
            {
              replace: true,
            }
          );

          return;
        }


        // ----------------------------------------------------
        // Other errors
        // ----------------------------------------------------

        if (!response.ok) {
          throw new Error(
            data?.error ||
            data?.message ||
            "Unable to load patient case."
          );
        }


        // ----------------------------------------------------
        // Backend may return:
        //
        // {
        //   record: {...}
        // }
        //
        // OR
        //
        // {...}
        // ----------------------------------------------------

        const loadedRecord =
          data?.record || data;


        if (
          !loadedRecord ||
          typeof loadedRecord !== "object"
        ) {
          throw new Error(
            "Invalid patient record received from server."
          );
        }


        setRecord(
          loadedRecord
        );


        setDiagnosis(
          loadedRecord?.diagnosis ||
          ""
        );


        setDoctorNotes(
          loadedRecord?.doctor_notes ||
          ""
        );

      } catch (error) {
        console.error(
          "Error loading patient case:",
          error
        );

        toast.error(
          error?.message ||
          "Unable to load patient case."
        );
      } finally {
        setLoading(false);
      }
    };


    if (id) {
      loadRecord();
    }
  }, [id, navigate]);


  // ==========================================================
  // SAVE DOCTOR REVIEW
  // ==========================================================

  const handleSaveReview = async () => {
    try {
      setSaving(true);


      const token = getToken();


      if (!token) {
        toast.error(
          "Please login again."
        );

        navigate(
          "/doctor-login",
          {
            replace: true,
          }
        );

        return;
      }


      const response = await fetch(
        `${API_BASE_URL}/api/records/${id}/review`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            diagnosis:
              diagnosis.trim(),

            doctor_notes:
              doctorNotes.trim(),
          }),
        }
      );


      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }


      if (response.status === 401) {
        toast.error(
          "Doctor session expired. Please login again."
        );

        navigate(
          "/doctor-login",
          {
            replace: true,
          }
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          "Unable to save doctor review."
        );
      }


      const updatedRecord =
        data?.record || data;


      setRecord(
        (previous) => ({
          ...previous,

          ...(updatedRecord || {}),

          diagnosis:
            updatedRecord?.diagnosis ??
            diagnosis.trim(),

          doctor_notes:
            updatedRecord?.doctor_notes ??
            doctorNotes.trim(),
        })
      );


      toast.success(
        "Doctor review saved successfully."
      );

    } catch (error) {
      console.error(
        "Error saving doctor review:",
        error
      );

      toast.error(
        error?.message ||
        "Unable to save doctor review."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // GENERATE PATIENT CASE PDF
  // ==========================================================

  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);


      const token = getToken();


      if (!token) {
        toast.error(
          "Please login again."
        );

        navigate(
          "/doctor-login",
          {
            replace: true,
          }
        );

        return;
      }


      console.log(
        "Generating PDF for record:",
        id
      );


      const response = await fetch(
        `${API_BASE_URL}/api/records/${id}/generate-pdf`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/pdf",
          },
        }
      );


      // ------------------------------------------------------
      // Unauthorized
      // ------------------------------------------------------

      if (response.status === 401) {
        toast.error(
          "Doctor session expired. Please login again."
        );

        navigate(
          "/doctor-login",
          {
            replace: true,
          }
        );

        return;
      }


      // ------------------------------------------------------
      // Error
      // ------------------------------------------------------

      if (!response.ok) {
        let errorMessage =
          "Unable to generate patient case PDF.";


        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData?.error ||
            errorData?.message ||
            errorMessage;
        } catch {
          // Response was not JSON.
        }


        throw new Error(
          errorMessage
        );
      }


      // ------------------------------------------------------
      // Convert response to PDF Blob
      // ------------------------------------------------------

      const pdfBlob =
        await response.blob();


      if (
        !pdfBlob ||
        pdfBlob.size === 0
      ) {
        throw new Error(
          "The server returned an empty PDF."
        );
      }


      // ------------------------------------------------------
      // Create temporary download URL
      // ------------------------------------------------------

      const downloadUrl =
        window.URL.createObjectURL(
          pdfBlob
        );


      const link =
        document.createElement("a");


      link.href =
        downloadUrl;


      link.download =
        `ArogyaAI_Patient_Case_${id}.pdf`;


      document.body.appendChild(
        link
      );


      // Start download
      link.click();


      // Remove link
      link.remove();


      // Release URL
      window.URL.revokeObjectURL(
        downloadUrl
      );


      toast.success(
        "Patient case PDF downloaded successfully."
      );

    } catch (error) {
      console.error(
        "Error generating PDF:",
        error
      );

      toast.error(
        error?.message ||
        "Unable to generate patient case PDF."
      );
    } finally {
      setGeneratingPdf(false);
    }
  };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <Loader2
            className="h-8 w-8 animate-spin text-primary"
          />

          <p className="text-sm text-muted-foreground">
            Loading patient case...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // RECORD NOT FOUND
  // ==========================================================

  if (!record) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">

        <Card className="w-full max-w-md">

          <CardContent className="pt-6 text-center">

            <AlertTriangle
              className="mx-auto h-10 w-10 text-destructive mb-4"
            />


            <h2 className="text-xl font-semibold mb-2">
              Patient case not found
            </h2>


            <p className="text-sm text-muted-foreground mb-6">
              The requested medical record
              could not be loaded.
            </p>


            <Button
              onClick={() =>
                navigate(
                  "/doctor-home"
                )
              }
              className="w-full"
            >

              <ArrowLeft
                className="mr-2 h-4 w-4"
              />

              Back to Doctor Home

            </Button>

          </CardContent>

        </Card>

      </div>
    );
  }


  // ==========================================================
  // PATIENT OBJECT
  // ==========================================================

  const patient =
    record?.patient || {};


  // ==========================================================
  // PATIENT INFORMATION
  // ==========================================================

  const patientName =
    patient?.name ||
    record?.patient_name ||
    record?.name ||
    "Patient";


  const patientId =
    patient?.id ||
    record?.patient_id ||
    "-";


  const phone =
    patient?.phone ||
    record?.phone ||
    "-";


  const email =
    patient?.email ||
    record?.email ||
    "-";


  const dateOfBirth =
    patient?.date_of_birth ||
    record?.date_of_birth ||
    "-";


  const gender =
    patient?.gender ||
    record?.gender ||
    "-";


  const medicalHistory =
    patient?.medical_history ||
    record?.medical_history ||
    "No medical history provided.";


  const city =
    patient?.city ||
    record?.city ||
    "";


  const state =
    patient?.state ||
    record?.state ||
    "";


  const pincode =
    patient?.pincode ||
    record?.pincode ||
    "";


  const address =
    patient?.address ||
    record?.address ||
    "";


  // ==========================================================
  // MEDICAL RECORD INFORMATION
  // ==========================================================

  const symptoms =
    record?.symptoms ||
    "No symptoms provided.";


  const duration =
    record?.duration ||
    "-";


  const problemLocation =
    record?.problem_location ||
    "Not provided";


  const occurredBefore =
    record?.occurred_before ||
    "Not provided";


  const urgencyLevel =
    record?.urgency_level ||
    "Unknown";


  const urgencyScore =
    record?.urgency_score ??
    "-";


  const status =
    record?.status ||
    "pending";


  const createdAt =
    record?.created_at ||
    "-";


  const reviewedAt =
    record?.reviewed_at ||
    "-";


  // ==========================================================
  // TAGS
  // ==========================================================

  let tags = [];


  if (
    Array.isArray(
      record?.tags
    )
  ) {
    tags =
      record.tags;
  } else {
    try {
      const parsedTags =
        JSON.parse(
          record?.tags ||
          "[]"
        );

      if (
        Array.isArray(
          parsedTags
        )
      ) {
        tags =
          parsedTags;
      }
    } catch {
      tags = [];
    }
  }


  // ==========================================================
  // URGENCY STYLE
  // ==========================================================

  const getUrgencyClass = (
    level
  ) => {
    const value =
      String(level)
        .toLowerCase();


    if (
      value.includes("high") ||
      value.includes("critical") ||
      value.includes("emergency")
    ) {
      return "bg-red-100 text-red-700 border-red-200";
    }


    if (
      value.includes("medium") ||
      value.includes("moderate")
    ) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }


    if (
      value.includes("low") ||
      value.includes("normal")
    ) {
      return "bg-green-100 text-green-700 border-green-200";
    }


    return "bg-muted text-muted-foreground";
  };


  // ==========================================================
  // STATUS STYLE
  // ==========================================================

  const getStatusClass = (
    value
  ) => {
    const statusValue =
      String(value)
        .toLowerCase();


    if (
      statusValue === "reviewed" ||
      statusValue === "completed"
    ) {
      return "bg-green-100 text-green-700 border-green-200";
    }


    if (
      statusValue === "pending"
    ) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }


    return "bg-muted text-muted-foreground";
  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="min-h-screen bg-background">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b bg-background/95 backdrop-blur">

        <div className="container mx-auto px-4 py-4">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


            {/* ------------------------------------------------
                HEADER LEFT
            ------------------------------------------------ */}

            <div className="flex items-center gap-3">

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate(
                    "/doctor-home"
                  )
                }
              >

                <ArrowLeft
                  className="h-5 w-5"
                />

              </Button>


              <div>

                <h1 className="text-xl font-bold">
                  Patient Case
                </h1>

                <p className="text-sm text-muted-foreground">
                  Review patient medical information
                </p>

              </div>

            </div>


            {/* ------------------------------------------------
                HEADER PDF BUTTON
            ------------------------------------------------ */}

            <Button
              onClick={
                handleGeneratePdf
              }
              disabled={
                generatingPdf
              }
              size="lg"
              className="w-full lg:w-auto"
            >

              {generatingPdf ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                  />

                  Generating PDF...
                </>
              ) : (
                <>
                  <Download
                    className="mr-2 h-4 w-4"
                  />

                  Generate PDF
                </>
              )}

            </Button>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="container mx-auto px-4 py-6">

        <div className="grid gap-6 lg:grid-cols-3">


          {/* ==================================================
              MAIN COLUMN
          ================================================== */}

          <div className="lg:col-span-2 space-y-6">


            {/* =================================================
                PATIENT INFORMATION
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <User
                    className="h-5 w-5 text-primary"
                  />

                  Patient Information

                </CardTitle>

              </CardHeader>


              <CardContent>

                <div className="grid gap-5 sm:grid-cols-2">


                  <InfoItem
                    icon={
                      <User className="h-4 w-4" />
                    }
                    label="Patient Name"
                    value={
                      patientName
                    }
                  />


                  <InfoItem
                    icon={
                      <FileText className="h-4 w-4" />
                    }
                    label="Patient ID"
                    value={
                      String(
                        patientId
                      )
                    }
                  />


                  <InfoItem
                    icon={
                      <Phone className="h-4 w-4" />
                    }
                    label="Phone"
                    value={phone}
                  />


                  <InfoItem
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="Email"
                    value={email}
                  />


                  <InfoItem
                    icon={
                      <Calendar className="h-4 w-4" />
                    }
                    label="Date of Birth"
                    value={
                      dateOfBirth
                    }
                  />


                  <InfoItem
                    icon={
                      <User className="h-4 w-4" />
                    }
                    label="Gender"
                    value={gender}
                  />

                </div>


                {(address ||
                  city ||
                  state ||
                  pincode) && (
                  <>
                    <Separator
                      className="my-5"
                    />

                    <InfoItem
                      icon={
                        <MapPin className="h-4 w-4" />
                      }
                      label="Address"
                      value={[
                        address,
                        city,
                        state,
                        pincode,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(", ")}
                    />
                  </>
                )}

              </CardContent>

            </Card>


            {/* =================================================
                PROBLEM DETAILS
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <Activity
                    className="h-5 w-5 text-primary"
                  />

                  Problem Details

                </CardTitle>

              </CardHeader>


              <CardContent className="space-y-5">


                <div className="grid gap-5 sm:grid-cols-2">


                  {/* EXACT LOCATION */}

                  <InfoItem
                    icon={
                      <MapPin className="h-4 w-4" />
                    }
                    label="Exact Location of Problem"
                    value={
                      problemLocation
                    }
                  />


                  {/* PREVIOUS OCCURRENCE */}

                  <InfoItem
                    icon={
                      <Clock className="h-4 w-4" />
                    }
                    label="Has This Occurred Before?"
                    value={
                      occurredBefore
                    }
                  />


                  {/* DURATION */}

                  <InfoItem
                    icon={
                      <Clock className="h-4 w-4" />
                    }
                    label="Duration"
                    value={duration}
                  />

                </div>


                <Separator />


                {/* SYMPTOMS */}

                <div>

                  <p className="text-sm font-medium mb-2">
                    Main Symptoms
                  </p>


                  <div className="rounded-lg border bg-muted/30 p-4">

                    <p className="text-sm whitespace-pre-wrap leading-6">
                      {symptoms}
                    </p>

                  </div>

                </div>


                {/* TAGS */}

                {tags.length > 0 && (
                  <div>

                    <p className="text-sm font-medium mb-2">
                      Symptoms / Tags
                    </p>


                    <div className="flex flex-wrap gap-2">

                      {tags.map(
                        (
                          tag,
                          index
                        ) => (
                          <Badge
                            key={`${tag}-${index}`}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        )
                      )}

                    </div>

                  </div>
                )}

              </CardContent>

            </Card>


            {/* =================================================
                MEDICAL HISTORY
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <Stethoscope
                    className="h-5 w-5 text-primary"
                  />

                  Medical History

                </CardTitle>

              </CardHeader>


              <CardContent>

                <div className="rounded-lg border bg-muted/30 p-4">

                  <p className="text-sm whitespace-pre-wrap leading-6">
                    {medicalHistory}
                  </p>

                </div>

              </CardContent>

            </Card>


            {/* =================================================
                DOCTOR REVIEW
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <Stethoscope
                    className="h-5 w-5 text-primary"
                  />

                  Doctor Review

                </CardTitle>

              </CardHeader>


              <CardContent className="space-y-5">


                {/* DIAGNOSIS */}

                <div className="space-y-2">

                  <Label htmlFor="diagnosis">
                    Diagnosis
                  </Label>


                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis..."
                    value={
                      diagnosis
                    }
                    onChange={
                      (event) =>
                        setDiagnosis(
                          event.target.value
                        )
                    }
                    rows={4}
                  />

                </div>


                {/* DOCTOR NOTES */}

                <div className="space-y-2">

                  <Label htmlFor="doctor-notes">
                    Doctor Notes
                  </Label>


                  <Textarea
                    id="doctor-notes"
                    placeholder="Add your notes, recommendations or observations..."
                    value={
                      doctorNotes
                    }
                    onChange={
                      (event) =>
                        setDoctorNotes(
                          event.target.value
                        )
                    }
                    rows={5}
                  />

                </div>


                {/* SAVE REVIEW */}

                <Button
                  onClick={
                    handleSaveReview
                  }
                  disabled={saving}
                  className="w-full sm:w-auto"
                >

                  {saving ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save
                        className="mr-2 h-4 w-4"
                      />

                      Save Review
                    </>
                  )}

                </Button>

              </CardContent>

            </Card>

          </div>


          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}

          <div className="space-y-6">


            {/* =================================================
                CASE PRIORITY
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <AlertTriangle
                    className="h-5 w-5 text-primary"
                  />

                  Case Priority

                </CardTitle>

              </CardHeader>


              <CardContent className="space-y-4">


                <div className="flex items-center justify-between gap-3">

                  <span className="text-sm text-muted-foreground">
                    Urgency
                  </span>


                  <Badge
                    variant="outline"
                    className={
                      getUrgencyClass(
                        urgencyLevel
                      )
                    }
                  >
                    {urgencyLevel}
                  </Badge>

                </div>


                <Separator />


                <div className="flex items-center justify-between">

                  <span className="text-sm text-muted-foreground">
                    Urgency Score
                  </span>


                  <span className="font-semibold">
                    {urgencyScore}
                  </span>

                </div>

              </CardContent>

            </Card>


            {/* =================================================
                CASE STATUS
            ================================================= */}

            <Card>

              <CardHeader>

                <CardTitle>
                  Case Status
                </CardTitle>

              </CardHeader>


              <CardContent className="space-y-4">


                <div className="flex items-center gap-3">

                  <CheckCircle2
                    className="h-5 w-5 text-primary"
                  />


                  <Badge
                    variant="outline"
                    className={
                      getStatusClass(
                        status
                      )
                    }
                  >
                    {String(status)
                      .replace(
                        /^./,
                        (
                          character
                        ) =>
                          character.toUpperCase()
                      )}
                  </Badge>

                </div>


                <Separator />


                <InfoItem
                  icon={
                    <Calendar className="h-4 w-4" />
                  }
                  label="Submitted"
                  value={
                    createdAt
                  }
                />


                {reviewedAt !== "-" && (
                  <InfoItem
                    icon={
                      <CheckCircle2 className="h-4 w-4" />
                    }
                    label="Reviewed"
                    value={
                      reviewedAt
                    }
                  />
                )}

              </CardContent>

            </Card>


            {/* =================================================
                GENERATE PDF
            ================================================= */}

            <Card className="border-primary/20 bg-primary/5">

              <CardHeader>

                <CardTitle className="flex items-center gap-2">

                  <FileText
                    className="h-5 w-5 text-primary"
                  />

                  Patient Case PDF

                </CardTitle>

              </CardHeader>


              <CardContent>

                <p className="text-sm text-muted-foreground mb-4">

                  Generate a complete PDF containing
                  patient information, problem details,
                  symptoms, medical history, urgency,
                  diagnosis and doctor notes.

                </p>


                <Button
                  onClick={
                    handleGeneratePdf
                  }
                  disabled={
                    generatingPdf
                  }
                  className="w-full"
                >

                  {generatingPdf ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                      />

                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download
                        className="mr-2 h-4 w-4"
                      />

                      Generate PDF
                    </>
                  )}

                </Button>

              </CardContent>

            </Card>


            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                navigate(
                  "/doctor-home"
                )
              }
            >

              <ArrowLeft
                className="mr-2 h-4 w-4"
              />

              Back to Doctor Home

            </Button>

          </div>

        </div>

      </main>

    </div>
  );
}


// ============================================================
// INFORMATION COMPONENT
// ============================================================

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">

      <div className="mt-0.5 text-primary">
        {icon}
      </div>


      <div className="min-w-0">

        <p className="text-xs text-muted-foreground">
          {label}
        </p>


        <p className="text-sm font-medium break-words mt-0.5">
          {value || "-"}
        </p>

      </div>

    </div>
  );
}
