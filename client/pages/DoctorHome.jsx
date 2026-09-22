import { useEffect, useState } from "react";
import { CalendarDays, FileText, HeartPulse, Home, LogOut, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, clearAuth } from "@shared/api";
import { urgencyBadgeVariant } from "@/lib/urgency";

const navigation = [
  { label: "Profile", icon: UserRound, path: "/doctor-profile" },
  { label: "Patient Records", icon: FileText, path: "/doctor-home" },
  { label: "Appointments", icon: CalendarDays, path: "/doctor-home" },
];

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Awaiting review", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
];

export default function DoctorHome() {
  const location = useLocation();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const query = filter === "all" ? "" : `?status=${filter}`;

    api
      .get(`/records${query}`)
      .then(({ records }) => setRecords(records))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, [filter]);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="relative flex w-full flex-col border-b border-border bg-card px-5 py-6 md:fixed md:inset-y-0 md:left-0 md:w-72 md:border-b-0 md:border-r">
        <Link to="/" className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">ArogyaAI</span>
        </Link>

        <div className="mt-12 px-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Practice</p>
          <nav className="mt-4 space-y-2">
            {navigation.map(({ label, icon: Icon, path }) => (
              <Link
                key={label}
                to={path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  label === "Profile" && location.pathname === "/doctor-profile" && "bg-accent text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-border pt-5">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen p-6 sm:p-10 md:ml-72">
        <div className="mx-auto max-w-5xl">
          <header>
            <p className="text-sm font-medium text-primary">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Your practice space</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cases are shortlisted and sorted by urgency so you can triage faster.
            </p>
          </header>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Shortlisted records */}
          <div className="mt-6 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading patient records…</p>}

            {!isLoading && records.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
                No cases here right now.
              </div>
            )}

            {records.map((record) => (
              <Link
                key={record.id}
                to={`/doctor-home/records/${record.id}`}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={urgencyBadgeVariant(record.urgency_level)}>
                        {record.urgency_level} priority
                      </Badge>
                      <Badge variant="outline">
                        {record.status === "reviewed" ? "Reviewed" : "Awaiting review"}
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {record.patientName}
                      {record.patientAge !== null && (
                        <span className="font-normal text-muted-foreground"> · {record.patientAge}y</span>
                      )}
                      {record.patientGender && (
                        <span className="font-normal text-muted-foreground"> · {record.patientGender}</span>
                      )}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {record.headline}
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
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
