import { useEffect, useState } from "react";
import { CalendarDays, FileText, HeartPulse, LogOut, Plus, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api, clearAuth } from "@shared/api";
import { urgencyBadgeVariant } from "@/lib/urgency";

const navigation = [
  { label: "Profile", icon: UserRound, path: "/user-profile" },
  { label: "Medical Records", icon: FileText, path: "/medical-records" },
  { label: "Appointments", icon: CalendarDays, path: "/user-home" },
];

export default function UserHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/records/mine")
      .then(({ records }) => setRecords(records))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const pendingCount = records.filter((r) => r.status === "pending").length;
  const reviewedCount = records.filter((r) => r.status === "reviewed").length;
  const recentRecords = records.slice(0, 3);

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
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">My Health</p>
          <nav className="mt-4 space-y-2">
            {navigation.map(({ label, icon: Icon, path }) => (
              <Link
                key={label}
                to={path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname === path && "bg-accent text-accent-foreground",
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
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Your health space</h1>
            </div>

            <Button asChild>
              <Link to="/medical-records/new">
                <Plus className="h-4 w-4" />
                New Medical Record
              </Link>
            </Button>
          </header>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total records</p>
              <p className="mt-2 text-2xl font-bold">{records.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Awaiting review</p>
              <p className="mt-2 text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reviewed</p>
              <p className="mt-2 text-2xl font-bold">{reviewedCount}</p>
            </div>
          </div>

          {/* Recent records */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent records</h2>
              <Link to="/medical-records" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

              {!isLoading && recentRecords.length === 0 && (
                <div className="rounded-3xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
                  You haven't submitted any medical records yet.
                </div>
              )}

              {recentRecords.map((record) => (
                <Link
                  to="/medical-records"
                  key={record.id}
                  className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={urgencyBadgeVariant(record.urgency_level)}>
                          {record.urgency_level}
                        </Badge>
                        <Badge variant="outline">
                          {record.status === "reviewed" ? "Reviewed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {record.symptoms.length > 90 ? `${record.symptoms.slice(0, 90)}…` : record.symptoms}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
