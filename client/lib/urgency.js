// Maps a triage urgency level to a Badge `variant` from the existing
// design system, so High/Medium/Low always render consistently wherever
// they're shown (doctor dashboard, record detail, etc).
export function urgencyBadgeVariant(level) {
  switch (level) {
    case "High":
      return "destructive";
    case "Medium":
      return "default";
    default:
      return "secondary";
  }
}
