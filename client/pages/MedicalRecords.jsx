import { useEffect, useState } from "react";
import { FileText, Home, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, reportUrl } from "@shared/api";
import { urgencyBadgeVariant } from "@/lib/urgency";

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/records/mine")
      .then(({ records }) => setRecords(records))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-3xl">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Medical Records</h1>

          <div className="flex items-center gap-2">
            <Link
              to="/user-home"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>

            <Button asChild size="sm">
              <Link to="/medical-records/new">
                <Plus className="h-4 w-4" />
                New Record
              </Link>
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Everything you've submitted to your care team, most recent first.
        </p>

        {/* Records List */}
        <div className="mt-8 space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading your records…</p>
          )}

          {!isLoading && records.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No medical records yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first record so a doctor can review your case.
              </p>
              <Button asChild className="mt-5">
                <Link to="/medical-records/new">
                  <Plus className="h-4 w-4" />
                  New Record
                </Link>
              </Button>
            </div>
          )}

          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={urgencyBadgeVariant(record.urgency_level)}>
                      {record.urgency_level} priority
                    </Badge>
                    <Badge variant="outline">
                      {record.status === "reviewed" ? "Reviewed by doctor" : "Awaiting review"}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm font-medium text-foreground">
                    {record.symptoms}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Duration: {record.duration}
                  </p>
                </div>

                <p className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(record.created_at).toLocaleDateString()}
                </p>
              </div>

              {record.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {record.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {record.report_filename && (
                <a
                  href={reportUrl(record.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View attached report
                </a>
              )}

              {record.status === "reviewed" && (
                <div className="mt-4 rounded-xl bg-accent/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Doctor's notes
                  </p>
                  {record.diagnosis && (
                    <p className="mt-1 text-sm font-medium text-foreground">
                      Diagnosis: {record.diagnosis}
                    </p>
                  )}
                  {record.doctor_notes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {record.doctor_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
