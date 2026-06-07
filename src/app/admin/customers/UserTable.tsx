"use client";

import { useState } from "react";
import { promoteUserRole, updateCustomerDetails, createCustomerByAdmin } from "@/app/actions";
import { 
  Shield, 
  User, 
  Calendar, 
  ShoppingBag, 
  Check, 
  Loader2,
  AlertCircle,
  Edit,
  X,
  UserPlus,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  phone?: string | null;
  fax?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  _count: {
    orders: number;
  };
}

export default function UserTable({ initialUsers }: { initialUsers: UserRecord[] }) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

  // ─── Edit existing user state ────────────────────────────────────────
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhoneCode, setEditPhoneCode] = useState("+91");
  const [editPhoneLocal, setEditPhoneLocal] = useState("");
  const [editFax, setEditFax] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editCountry, setEditCountry] = useState("India");
  const [showEditAdditional, setShowEditAdditional] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // ─── Create new customer state ────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("CUSTOMER");
  const [createPhoneCode, setCreatePhoneCode] = useState("+91");
  const [createPhoneLocal, setCreatePhoneLocal] = useState("");
  const [createFax, setCreateFax] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createState, setCreateState] = useState("");
  const [createPostalCode, setCreatePostalCode] = useState("");
  const [createCountry, setCreateCountry] = useState("India");
  const [showCreateAdditional, setShowCreateAdditional] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────
  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreateRole("CUSTOMER");
    setCreatePhoneCode("+91");
    setCreatePhoneLocal("");
    setCreateFax("");
    setCreateAddress("");
    setCreateCity("");
    setCreateState("");
    setCreatePostalCode("");
    setCreateCountry("India");
    setShowCreateAdditional(false);
    setCreateError("");
    setCreateSuccess(false);
  };

  const openCreate = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const startEditing = (user: UserRecord) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    
    // Parse telephone number
    if (user.phone) {
      const fullPhone = user.phone;
      const parts = fullPhone.split(" ");
      if (parts.length >= 2) {
        setEditPhoneCode(parts[0]);
        setEditPhoneLocal(parts.slice(1).join(" "));
      } else if (fullPhone.startsWith("+")) {
        const matchedCode = ["+971", "+966", "+91", "+44", "+49", "+33", "+61", "+81", "+65", "+1"].find(c => fullPhone.startsWith(c));
        if (matchedCode) {
          setEditPhoneCode(matchedCode);
          setEditPhoneLocal(fullPhone.substring(matchedCode.length).trim());
        } else {
          setEditPhoneCode("+91");
          setEditPhoneLocal(fullPhone);
        }
      } else {
        setEditPhoneCode("+91");
        setEditPhoneLocal(fullPhone);
      }
    } else {
      setEditPhoneCode("+91");
      setEditPhoneLocal("");
    }
    
    setEditFax(user.fax || "");
    setEditAddress(user.address || "");
    setEditCity(user.city || "");
    setEditState(user.state || "");
    setEditPostalCode(user.postalCode || "");
    setEditCountry(user.country || "India");
    setShowEditAdditional(false);
    
    setEditError("");
    setEditSuccess(false);
  };

  // ─── Create submit handler ────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess(false);

    if (createPhoneLocal.trim() && createPhoneLocal.trim().length !== 10) {
      setCreateError("Phone number must be exactly 10 digits.");
      setCreateLoading(false);
      return;
    }

    try {
      const res = await createCustomerByAdmin({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
        phone: createPhoneLocal.trim() ? `${createPhoneCode} ${createPhoneLocal.trim()}` : undefined,
        fax: createFax || undefined,
        address: createAddress || undefined,
        city: createCity || undefined,
        state: createState || undefined,
        postalCode: createPostalCode || undefined,
        country: createCountry || undefined
      });

      if (res.success && res.user) {
        setUsers(prev => [res.user as UserRecord, ...prev]);
        setCreateSuccess(true);
        setTimeout(() => {
          setShowCreate(false);
          resetCreateForm();
        }, 1400);
      } else {
        setCreateError((res as any).error || "Failed to create customer account.");
      }
    } catch {
      setCreateError("An unexpected error occurred.");
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Edit submit handler ──────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError("");
    setEditSuccess(false);

    const compiledPhone = editPhoneLocal.trim() ? `${editPhoneCode} ${editPhoneLocal.trim()}` : "";

    if (editPhoneLocal.trim() && editPhoneLocal.trim().length !== 10) {
      setEditError("Phone number must be exactly 10 digits.");
      setEditLoading(false);
      return;
    }

    try {
      const res = await updateCustomerDetails(editingUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        password: editPassword || undefined,
        phone: compiledPhone || undefined,
        fax: editFax || undefined,
        address: editAddress || undefined,
        city: editCity || undefined,
        state: editState || undefined,
        postalCode: editPostalCode || undefined,
        country: editCountry || undefined
      });

      if (res.success) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
          ...u, 
          name: editName, 
          email: editEmail, 
          role: editRole,
          phone: compiledPhone || null,
          fax: editFax || null,
          address: editAddress || null,
          city: editCity || null,
          state: editState || null,
          postalCode: editPostalCode || null,
          country: editCountry || null
        } : u));
        setEditSuccess(true);
        setTimeout(() => {
          setEditingUser(null);
        }, 1200);
      } else {
        setEditError((res as any).error || "Failed to update customer credentials.");
      }
    } catch {
      setEditError("An unexpected error occurred.");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Role quick-change ────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    setFeedback(null);

    try {
      const res = await promoteUserRole(userId, newRole);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setFeedback({ id: userId, msg: `Role upgraded to ${newRole}!`, type: "success" });
      } else {
        setFeedback({ id: userId, msg: (res as any).error || "Failed to update role.", type: "error" });
      }
    } catch {
      setFeedback({ id: userId, msg: "Failed to communicate with authentication gateway.", type: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  // ─── Shared modal style ───────────────────────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "fadeIn 0.2s ease-out"
  };
  const modalStyle: React.CSSProperties = {
    background: "#ffffff", borderRadius: "16px", padding: "2rem",
    width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
    display: "flex", flexDirection: "column", gap: "1.5rem",
    maxHeight: "90vh", overflowY: "auto"
  };

  return (
    <>
      {/* ── Toolbar bar above table ─────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          onClick={openCreate}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", fontWeight: 700, fontSize: "0.875rem" }}
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* ── Customer table ──────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.01)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>Customer Detail</th>
                <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>Registration Date</th>
                <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textAlign: "center" }}>Orders Placed</th>
                <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>Privilege Role</th>
                <th style={{ padding: "1.25rem 1.5rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <User size={40} style={{ margin: "0 auto 1rem auto", opacity: 0.4 }} />
                    <div>No customers yet. Use the <strong>Add Customer</strong> button above to create the first account.</div>
                  </td>
                </tr>
              ) : users.map((user) => {
                const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric"
                });

                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} className="hover-row">
                    {/* Customer Info */}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          background: user.role === "ADMIN" ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "var(--bg-tertiary)",
                          color: user.role === "ADMIN" ? "var(--brand-primary)" : "var(--text-secondary)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600,
                          border: user.role === "ADMIN" ? "1.5px solid var(--brand-primary)" : "1px solid var(--border-color)"
                        }}>
                          {user.role === "ADMIN" ? <Shield size={18} /> : <User size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>{user.name}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "1.25rem 1.5rem", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {formattedDate}
                      </div>
                    </td>

                    {/* Orders count */}
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        padding: "0.25rem 0.6rem",
                        background: user._count.orders > 0 ? "rgba(212,175,55,0.08)" : "var(--bg-secondary)",
                        color: user._count.orders > 0 ? "var(--brand-primary)" : "var(--text-muted)",
                        borderRadius: "var(--radius-xl)", fontWeight: 600, fontSize: "0.8rem"
                      }}>
                        <ShoppingBag size={12} />
                        {user._count.orders} orders
                      </span>
                    </td>

                    {/* Role badge */}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <span style={{
                        display: "inline-block", padding: "0.3rem 0.6rem",
                        borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.05em",
                        background:
                          user.role === "ADMIN" ? "linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)" :
                          user.role === "STAFF" ? "rgba(59, 130, 246, 0.1)" : "rgba(100, 116, 139, 0.1)",
                        color:
                          user.role === "ADMIN" ? "#854d0e" :
                          user.role === "STAFF" ? "#2563eb" : "#475569",
                        border: user.role === "ADMIN" ? "1px solid #eab308" : "none"
                      }}>
                        {user.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={loadingId === user.id}
                          style={{
                            padding: "0.4rem 0.8rem", borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-color)", background: "#ffffff",
                            fontSize: "0.85rem", fontWeight: 500, outline: "none", cursor: "pointer"
                          }}
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="STAFF">STAFF</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        <button
                          onClick={() => startEditing(user)}
                          className="btn btn-outline"
                          style={{ padding: "0.4rem 0.6rem", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}
                          title="Edit credentials & password"
                        >
                          <Edit size={14} /> Edit
                        </button>

                        {loadingId === user.id && (
                          <Loader2 size={16} className="animate-spin" color="var(--brand-primary)" />
                        )}

                        {feedback?.id === user.id && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "0.75rem", fontWeight: 500,
                            color: feedback.type === "success" ? "var(--success)" : "var(--danger)"
                          }}>
                            {feedback.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                            {feedback.msg}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Customer Modal ────────────────────────────────────── */}
      {showCreate && (
        <div style={overlayStyle} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UserPlus size={20} color="var(--brand-primary)" />
                Create Customer Account
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
                {createError}
              </div>
            )}
            {createSuccess && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid var(--success)", color: "var(--success)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
                ✓ Customer account created successfully!
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-base"
                  placeholder="e.g. Jane Smith"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address *</label>
                <input
                  type="email"
                  required
                  className="input-base"
                  placeholder="e.g. jane@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Privilege Role *</label>
                <select
                  className="input-base"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Collapsible Shipping & Contact Section */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateAdditional(!showCreateAdditional)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    transition: 'background 0.2s'
                  }}
                >
                  <span>Shipping & Contact Details (Optional)</span>
                  {showCreateAdditional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showCreateAdditional && (
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Phone</label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <select 
                            value={createPhoneCode}
                            onChange={(e) => setCreatePhoneCode(e.target.value)}
                            className="input-base" 
                            style={{ width: '65px', padding: '0.4rem 0.25rem', fontSize: '0.75rem', flexShrink: 0, background: 'var(--bg-primary)' }}
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+971">+971</option>
                            <option value="+49">+49</option>
                            <option value="+33">+33</option>
                            <option value="+61">+61</option>
                            <option value="+81">+81</option>
                            <option value="+65">+65</option>
                            <option value="+966">+966</option>
                          </select>
                          <input 
                            type="tel" 
                            className="input-base" 
                            maxLength={10}
                            placeholder="9999999999" 
                            value={createPhoneLocal}
                            onChange={(e) => setCreatePhoneLocal(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', flexGrow: 1 }} 
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Fax</label>
                        <input type="tel" className="input-base" placeholder="Fax number" value={createFax} onChange={(e) => setCreateFax(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Street Address</label>
                      <input type="text" className="input-base" placeholder="123 Shopping Lane" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>City</label>
                        <input type="text" className="input-base" placeholder="Mumbai" value={createCity} onChange={(e) => setCreateCity(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>State</label>
                        <input type="text" className="input-base" placeholder="Maharashtra" value={createState} onChange={(e) => setCreateState(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>ZIP / Postal Code</label>
                        <input type="text" className="input-base" placeholder="400001" value={createPostalCode} onChange={(e) => setCreatePostalCode(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Country</label>
                        <input type="text" className="input-base" placeholder="India" value={createCountry} onChange={(e) => setCreateCountry(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-primary)", display: "block" }}>
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set a secure password…"
                  className="input-base"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                  The customer can change this after their first login.
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, border: "1px solid var(--border-color)", background: "#ffffff", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, border: "none", background: "var(--brand-primary)", color: "#ffffff", cursor: createLoading ? "not-allowed" : "pointer", opacity: createLoading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                  {createLoading && <Loader2 size={16} className="animate-spin" />}
                  {createLoading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Credentials Modal ───────────────────────────────────── */}
      {editingUser && (
        <div style={overlayStyle} onClick={() => setEditingUser(null)}>
          <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={20} color="var(--brand-primary)" />
                Edit Credentials
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}>
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
                {editError}
              </div>
            )}
            {editSuccess && (
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid var(--success)", color: "var(--success)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
                ✓ Customer credentials updated successfully!
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-base"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Email Address *</label>
                <input
                  type="email"
                  required
                  className="input-base"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Privilege Role *</label>
                <select
                  className="input-base"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Collapsible Shipping & Contact Section */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowEditAdditional(!showEditAdditional)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    transition: 'background 0.2s'
                  }}
                >
                  <span>Shipping & Contact Details (Optional)</span>
                  {showEditAdditional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showEditAdditional && (
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Phone</label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <select 
                            value={editPhoneCode}
                            onChange={(e) => setEditPhoneCode(e.target.value)}
                            className="input-base" 
                            style={{ width: '65px', padding: '0.4rem 0.25rem', fontSize: '0.75rem', flexShrink: 0, background: 'var(--bg-primary)' }}
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+971">+971</option>
                            <option value="+49">+49</option>
                            <option value="+33">+33</option>
                            <option value="+61">+61</option>
                            <option value="+81">+81</option>
                            <option value="+65">+65</option>
                            <option value="+966">+966</option>
                          </select>
                          <input 
                            type="tel" 
                            className="input-base" 
                            maxLength={10}
                            placeholder="9999999999" 
                            value={editPhoneLocal}
                            onChange={(e) => setEditPhoneLocal(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', flexGrow: 1 }} 
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Fax</label>
                        <input type="tel" className="input-base" placeholder="Fax number" value={editFax} onChange={(e) => setEditFax(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Street Address</label>
                      <input type="text" className="input-base" placeholder="123 Shopping Lane" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>City</label>
                        <input type="text" className="input-base" placeholder="Mumbai" value={editCity} onChange={(e) => setEditCity(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>State</label>
                        <input type="text" className="input-base" placeholder="Maharashtra" value={editState} onChange={(e) => setEditState(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>ZIP / Postal Code</label>
                        <input type="text" className="input-base" placeholder="400001" value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.75rem' }}>Country</label>
                        <input type="text" className="input-base" placeholder="India" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", background: "var(--bg-secondary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-primary)", display: "block" }}>Password Reset Override</label>
                <input
                  type="password"
                  placeholder="Enter new password to reset..."
                  className="input-base"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>Leave blank to retain current password. Resetting hashes credentials instantly.</span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, border: "1px solid var(--border-color)", background: "#ffffff", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600, border: "none", background: "var(--brand-primary)", color: "#ffffff", cursor: "pointer", opacity: editLoading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >
                  {editLoading && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
