"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Check, AlertCircle } from "lucide-react";

export default function AIDescriptionGenerator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Find product name input from the DOM
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    if (!nameInput || !nameInput.value.trim()) {
      setStatus("error");
      setMessage("Please enter the Product Name first.");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    const productName = nameInput.value.trim();
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // 2. Perform online research using the Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(productName)}&maxResults=3`
      );

      if (!response.ok) {
        throw new Error("Failed to communicate with Google Books search index.");
      }

      const data = await response.json();
      const firstBook = data.items?.[0]?.volumeInfo;

      if (firstBook) {
        // Extract fields
        const description = firstBook.description || "";
        const publisher = firstBook.publisher || "";
        const publishedDate = firstBook.publishedDate || "";
        const isbn13 = firstBook.industryIdentifiers?.find(
          (id: any) => id.type === "ISBN_13"
        )?.identifier || "";
        const isbn10 = firstBook.industryIdentifiers?.find(
          (id: any) => id.type === "ISBN_10"
        )?.identifier || "";
        const image = firstBook.imageLinks?.thumbnail || "";

        // 3. Inject description into textarea
        const descTextarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
        if (descTextarea) {
          // Clean up HTML tags from description if present
          const cleanDesc = description.replace(/<\/?[^>]+(>|$)/g, "");
          descTextarea.value = cleanDesc || `A comprehensive guide covering the key topics and modules of "${productName}". Ideal for students, professionals, and general readers seeking to expand their learning scope.`;
          descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // 4. Auto-fill other specifications if empty
        const publisherInput = document.querySelector('input[name="publisher"]') as HTMLInputElement;
        if (publisherInput && !publisherInput.value.trim() && publisher) {
          publisherInput.value = publisher;
          publisherInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const editionDateInput = document.querySelector('input[name="editionDate"]') as HTMLInputElement;
        if (editionDateInput && !editionDateInput.value.trim() && publishedDate) {
          editionDateInput.value = publishedDate;
          editionDateInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const isbn13Input = document.querySelector('input[name="isbn13"]') as HTMLInputElement;
        if (isbn13Input && !isbn13Input.value.trim() && isbn13) {
          isbn13Input.value = isbn13;
          isbn13Input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const isbn10Input = document.querySelector('input[name="isbn10"]') as HTMLInputElement;
        if (isbn10Input && !isbn10Input.value.trim() && isbn10) {
          isbn10Input.value = isbn10;
          isbn10Input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Fill image URL if empty
        const imageInput = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
        if (imageInput && !imageInput.value.trim() && image) {
          // Convert http to https to avoid mixed content blocking
          const secureImage = image.replace("http://", "https://");
          imageInput.value = secureImage;
          imageInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        setStatus("success");
        setMessage("Auto-filled specifications and descriptions from online research!");
      } else {
        // Fallback: Generate a nice description using offline AI heuristics
        const descTextarea = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
        if (descTextarea) {
          const catSelect = document.querySelector('select[name="categoryId"]') as HTMLSelectElement;
          const categoryName = catSelect?.options[catSelect.selectedIndex]?.text || "General Book";
          
          let aiText = `Explore the comprehensive concepts of "${productName}". `;
          if (categoryName.toLowerCase().includes("textbook") || categoryName.toLowerCase().includes("cbse") || categoryName.toLowerCase().includes("icse")) {
            aiText += `This textbook guide is fully mapped to the latest school curriculum and board examination guidelines. It contains structured lesson summaries, key definitions, solved examples, and practice questions to ensure students master core topics easily.`;
          } else if (categoryName.toLowerCase().includes("stationery") || categoryName.toLowerCase().includes("journal")) {
            aiText += `Crafted from premium quality materials, this item offers excellent durability and design. Perfect for writing notes, drafting sketches, and office utilities.`;
          } else {
            aiText += `A beautifully written volume that offers valuable perspectives on its subject. Written in an engaging style, it is ideal for passionate readers looking to deepen their understanding.`;
          }

          descTextarea.value = aiText;
          descTextarea.dispatchEvent(new Event("input", { bubbles: true }));
          setStatus("success");
          setMessage("Drafted automated description based on category heuristics.");
        } else {
          throw new Error("No description input found.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Failed to generate description.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.35rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(234, 179, 8, 0.2)",
          transition: "all 0.15s"
        }}
      >
        {loading ? (
          <>
            <Loader2 size={12} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            <span>Researching...</span>
          </>
        ) : status === "success" ? (
          <>
            <Check size={12} />
            <span>Generated!</span>
          </>
        ) : (
          <>
            <Sparkles size={12} />
            <span>AI Description Generator</span>
          </>
        )}
      </button>

      {message && (
        <span style={{ 
          fontSize: "0.75rem", 
          fontWeight: 600,
          color: status === "success" ? "var(--success)" : status === "error" ? "var(--danger)" : "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          animation: "fadeIn 0.2s ease"
        }}>
          {status === "error" && <AlertCircle size={12} />}
          {message}
        </span>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
