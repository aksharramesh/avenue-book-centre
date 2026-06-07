import { getAllUsers } from "@/app/actions";
import UserTable from "./UserTable";
import { Users, UserPlus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersAdminPage() {
  const users = await getAllUsers();

  return (
    <div>
      {/* Header Panel */}
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
            Account Privilege Control
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Customer Directory
          </h1>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600
          }}>
            <Users size={16} color="var(--brand-primary)" />
            {users.length} registered users
          </div>
        </div>
      </div>

      {/* Description Context Callout */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        padding: "1rem 1.5rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "2rem",
        color: "var(--text-secondary)",
        fontSize: "0.875rem",
        lineHeight: 1.6
      }}>
        <strong>💡 Administrative Access Guidelines:</strong> This dashboard manages all corporate and individual customer credentials. 
        Promoting a user to <strong>ADMIN</strong> grants absolute command over inventory stocks, CMS content, and financial analytics report compilation. 
        Changing to <strong>STAFF</strong> unlocks general administrative panels without full database drop rights.
      </div>

      {/* Interactive User Table Component */}
      {users.length === 0 ? (
        <div style={{
          padding: "4rem 2rem",
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
          color: "var(--text-muted)"
        }}>
          <Users size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
          <h3>No User Records Found</h3>
          <p>Register new user accounts through the storefront registration portal to populate this directory.</p>
        </div>
      ) : (
        <UserTable initialUsers={users} />
      )}
    </div>
  );
}
