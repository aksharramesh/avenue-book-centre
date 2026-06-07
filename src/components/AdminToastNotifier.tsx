"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";

function ToastContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "info" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "info" | "error" = "info") {
    setToast({ msg, type });
    // Keep it visible for 3.5 seconds
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }

  // 1. Listen for success redirect query parameters
  useEffect(() => {
    const saved = searchParams.get("saved");
    const success = searchParams.get("success");
    const deleted = searchParams.get("deleted");
    const updated = searchParams.get("updated");
    const cleared = searchParams.get("cleared");

    if (saved === "true" || success === "true") {
      showToast("✅ Settings and changes saved successfully!", "success");
    } else if (deleted === "true") {
      showToast("🗑️ Item deleted successfully!", "success");
    } else if (updated === "true") {
      showToast("📝 Record updated successfully!", "success");
    } else if (cleared === "true") {
      showToast("🧹 System cache cleared successfully!", "success");
    }
  }, [searchParams, pathname]);

  // 2. Intercept click events on buttons to show live acknowledgements
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button");
      if (!button) return;

      const btnText = (button.innerText || button.textContent || "").trim();
      const type = button.getAttribute("type");
      const role = button.getAttribute("role");
      const ariaLabel = (button.getAttribute("aria-label") || "").toLowerCase();
      const title = (button.getAttribute("title") || "").toLowerCase();
      const id = (button.getAttribute("id") || "").toLowerCase();
      const text = btnText.toLowerCase();

      // Smart exclusions (navigation, tabs, pagination, modal close, cancel operations)
      if (
        role === "tab" ||
        button.hasAttribute("aria-expanded") ||
        button.hasAttribute("aria-selected") ||
        id.includes("toggle") ||
        id.includes("dropdown") ||
        ariaLabel.includes("close") ||
        ariaLabel.includes("dismiss") ||
        title.includes("close") ||
        title.includes("cancel") ||
        /^\d+$/.test(btnText) || // Number pagination
        /^(cancel|back|close|x|✕|next|previous|«|»|<|>|▼|☰)$/.test(text)
      ) {
        return;
      }

      // Check if it belongs to a form
      const form = button.closest("form");
      const isSubmit = type === "submit" || (!type && form);

      // We only show validation / processing messages for active mutation or submit actions
      const isAction = /save|submit|update|delete|remove|add|create|clear|reset|apply|confirm|import|run|execute|install|upload|rebuild|refresh|sync|generate/.test(
        text + " " + ariaLabel + " " + title
      );

      if (!isSubmit && !isAction) {
        return;
      }

      if (isSubmit) {
        if (form) {
          if (form.checkValidity()) {
            showToast(`⌛ Processing request: "${btnText || "Submit"}"...`, "info");
          } else {
            showToast("⚠️ Validation error: Please check required form fields.", "error");
          }
        } else {
          showToast(`⌛ Executing action: "${btnText || "Submit"}"...`, "info");
        }
      } else {
        // Generic action buttons (client-side or custom calls)
        showToast(`⌛ Processing operation: "${btnText || "Action"}"...`, "info");
      }
    };

    document.addEventListener("click", handleButtonClick);
    return () => document.removeEventListener("click", handleButtonClick);
  }, []);

  if (!toast) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      zIndex: 99999,
      background: toast.type === "success" 
        ? "rgba(16, 185, 129, 0.88)" // Emerald green glass
        : toast.type === "error" 
          ? "rgba(239, 68, 68, 0.88)" // Red glass
          : "rgba(14, 165, 233, 0.88)", // Sky blue glass
      color: "#ffffff",
      padding: "0.95rem 1.6rem",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "0.9rem",
      boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
      maxWidth: "400px",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "1px solid rgba(255,255,255,0.25)",
      letterSpacing: "0.02em",
    }}>
      {toast.msg}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function AdminToastNotifier() {
  return (
    <Suspense fallback={null}>
      <ToastContent />
    </Suspense>
  );
}
