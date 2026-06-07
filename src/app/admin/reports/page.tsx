import { getAnalyticsReports, getCurrencySettings } from "@/app/actions";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import AdminReportsTabs from "@/components/AdminReportsTabs";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [report, currency] = await Promise.all([getAnalyticsReports(), getCurrencySettings()]);

  if (!report) {
    return (
      <div style={{
        padding: "2rem",
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center"
      }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: "0 auto 1rem auto" }} />
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Unable to Load Reports</h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          There was an error querying database telemetry records.
        </p>
        <Link href="/admin" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <span style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            letterSpacing: "0.1em", 
            color: "var(--brand-primary)",
            fontWeight: 700
          }}>
            Operations Telemetry
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Reports & Business Intelligence
          </h1>
        </div>

        <Link 
          href="/admin/reports" 
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem" }}
        >
          <RefreshCw size={14} />
          Refresh telemetry
        </Link>
      </div>

      <AdminReportsTabs report={report} currency={currency} />
    </div>
  );
}
