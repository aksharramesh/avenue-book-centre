"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Compass, 
  Coins, 
  Zap, 
  Clock, 
  AlertCircle,
  ShoppingBag,
  RotateCcw
} from "lucide-react";
import { getRecommendationsCatalog } from "@/app/actions";
import HomeBuyButton from "@/components/HomeBuyButton";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  weight: number;
  imageUrl: string | null;
  fastDispatch: boolean;
  stock: number;
  categoryId: string;
  publisher: string | null;
  category: {
    name: string;
  };
}

interface RecommendedProduct extends Product {
  matchScore: number;
  matchReason: string;
}

export default function AIRecommendationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz states
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    interest: "",
    style: "",
    budget: ""
  });
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    document.title = "Personalized AI Reading Finder | Avenue Book Centre";
    const loadCatalog = async () => {
      try {
        const res = await getRecommendationsCatalog();
        if (res.success && res.products) {
          setProducts(res.products as Product[]);
        } else {
          setError(res.error || "Failed to load catalog.");
        }
      } catch (e: any) {
        setError(e.message || "Communication gateway error.");
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const handleAnswerSelect = (field: "interest" | "style" | "budget", value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    // Auto advance steps for a premium experience
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 250);
  };

  const resetQuiz = () => {
    setAnswers({ interest: "", style: "", budget: "" });
    setRecommendations([]);
    setStep(1);
  };

  const calculateRecommendations = () => {
    setLoading(true);
    
    setTimeout(() => {
      const results: RecommendedProduct[] = products.map(prod => {
        let score = 50; // base score
        const reasons: string[] = [];

        // 1. Genre interest matching (Max 25 pts)
        const catName = prod.category?.name?.toLowerCase() || "";
        const prodName = prod.name.toLowerCase();
        
        if (answers.interest === "TEXTBOOKS") {
          if (catName.includes("textbook") || catName.includes("cbse") || catName.includes("icse") || prodName.includes("guide") || prodName.includes("class")) {
            score += 25;
            reasons.push("Matches your educational curriculum interest");
          } else if (catName.includes("fiction") || catName.includes("novel")) {
            score -= 15;
          }
        } else if (answers.interest === "NOVELS") {
          if (catName.includes("fiction") || catName.includes("novel") || catName.includes("literature")) {
            score += 25;
            reasons.push("Matches your preference for stories and novels");
          } else if (catName.includes("textbook") || catName.includes("cbse")) {
            score -= 20;
          }
        } else if (answers.interest === "STATIONERY") {
          if (catName.includes("stationery") || catName.includes("journal") || catName.includes("pen") || catName.includes("office") || prodName.includes("notebook")) {
            score += 25;
            reasons.push("Perfect match for fine writing & stationery needs");
          } else if (catName.includes("textbook")) {
            score -= 10;
          }
        } else {
          score += 15; // General interest
          reasons.push("General catalog favorite");
        }

        // 2. Reading Shipping Style (Max 15 pts)
        if (answers.style === "QUICK") {
          if (prod.fastDispatch) {
            score += 15;
            reasons.push("Ready for immediate express shipping");
          }
          if (prod.weight < 0.6) {
            score += 5;
            reasons.push("Lightweight, handy study format");
          }
        } else if (answers.style === "COMPREHENSIVE") {
          if (prod.weight >= 0.6) {
            score += 15;
            reasons.push("In-depth comprehensive textbook dimensions");
          }
        }

        // 3. Budget Matching (Max 20 pts)
        if (answers.budget === "BUDGET") {
          if (prod.price <= 250) {
            score += 20;
            reasons.push("Fits perfectly under your ₹250 budget");
          } else if (prod.price > 400) {
            score -= 25;
          }
        } else if (answers.budget === "STANDARD") {
          if (prod.price > 250 && prod.price <= 600) {
            score += 20;
            reasons.push("Great value standard edition pricing");
          } else if (prod.price < 150 || prod.price > 700) {
            score -= 10;
          }
        } else if (answers.budget === "PREMIUM") {
          if (prod.price > 600) {
            score += 20;
            reasons.push("High-fidelity reference edition matching");
          } else {
            score -= 10;
          }
        }

        // Out of stock penalty
        if (prod.stock === 0) {
          score -= 15;
        }

        // Clamp score between 60% and 99% for realistic feel
        const finalScore = Math.max(60, Math.min(99, score));
        const primaryReason = reasons[0] || "Hand-selected by our reading advisors";

        return {
          ...prod,
          matchScore: finalScore,
          matchReason: primaryReason
        };
      });

      // Filter and sort results
      const sorted = results
        .filter(r => r.stock > 0 || r.matchScore > 75) // hide completely irrelevant out of stocks
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4);

      setRecommendations(sorted);
      setLoading(false);
    }, 900); // Simulated delay for premium analytical loader
  };

  // Run calculation when step reaches results
  useEffect(() => {
    if (step === 4 && products.length > 0) {
      calculateRecommendations();
    }
  }, [step, products]);

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", paddingBottom: "6rem" }}>
      
      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "3.5rem 0", color: "#ffffff", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <span style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            letterSpacing: "0.15em", 
            color: "#38bdf8",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "0.5rem"
          }}>
            <Sparkles size={14} /> Avenue Book Centre smart advisor
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.02em", margin: 0 }}>
            Personalized AI Reading Companion
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "1.05rem" }}>
            Answer 3 quick questions to discover your ideal study textbooks, literature, or writing materials.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "800px", marginTop: "3.5rem" }}>
        
        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.05)", 
            border: "1px solid var(--danger)", 
            color: "var(--danger)", 
            padding: "1rem 1.5rem", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Card */}
        <div className="card" style={{ 
          padding: "3rem 2.5rem", 
          background: "#ffffff", 
          borderRadius: "var(--radius-xl)", 
          boxShadow: "0 15px 40px rgba(0,0,0,0.025)",
          border: "1px solid var(--border-color)",
          minHeight: "360px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          
          {/* Step 1: Genre Interests */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>Question 1 of 3</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.25rem 0 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <BookOpen size={22} color="var(--brand-primary)" /> What is your primary reading category interest?
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <button 
                  onClick={() => handleAnswerSelect("interest", "TEXTBOOKS")}
                  className="btn btn-outline"
                  style={{ padding: "1.5rem", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", borderRadius: "12px", border: "2px solid var(--border-color)", textAlign: "center" }}
                >
                  <span style={{ fontSize: "2rem" }}>📚</span>
                  <strong style={{ fontSize: "0.95rem" }}>Curriculum &amp; Textbooks</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CBSE, ICSE, Study guides &amp; syllabus sheets</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("interest", "NOVELS")}
                  className="btn btn-outline"
                  style={{ padding: "1.5rem", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", borderRadius: "12px", border: "2px solid var(--border-color)", textAlign: "center" }}
                >
                  <span style={{ fontSize: "2rem" }}>📖</span>
                  <strong style={{ fontSize: "0.95rem" }}>Novels &amp; Literature</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fiction, non-fiction stories &amp; classics</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("interest", "STATIONERY")}
                  className="btn btn-outline"
                  style={{ padding: "1.5rem", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", borderRadius: "12px", border: "2px solid var(--border-color)", textAlign: "center" }}
                >
                  <span style={{ fontSize: "2rem" }}>✍️</span>
                  <strong style={{ fontSize: "0.95rem" }}>Fine Stationery &amp; Writing</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Journals, notebooks, office utility tools</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("interest", "ANY")}
                  className="btn btn-outline"
                  style={{ padding: "1.5rem", height: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", borderRadius: "12px", border: "2px solid var(--border-color)", textAlign: "center" }}
                >
                  <span style={{ fontSize: "2rem" }}>🔍</span>
                  <strong style={{ fontSize: "0.95rem" }}>General / Just Browsing</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Show me the most recommended list</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Reading / Shipping Style */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>Question 2 of 3</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.25rem 0 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Compass size={22} color="var(--brand-primary)" /> What best describes your study or reading style?
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button 
                  onClick={() => handleAnswerSelect("style", "QUICK")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem 1.5rem", height: "auto", display: "flex", alignItems: "center", gap: "1rem", borderRadius: "10px", border: "2px solid var(--border-color)", textAlign: "left" }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--brand-glow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} className="text-brand">
                    <Zap size={20} style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>Quick revision &amp; fast shipping</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>I prefer concise summaries, lightweight books, and fast dispatch shipping.</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("style", "COMPREHENSIVE")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem 1.5rem", height: "auto", display: "flex", alignItems: "center", gap: "1rem", borderRadius: "10px", border: "2px solid var(--border-color)", textAlign: "left" }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={20} style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>In-depth, comprehensive reference volumes</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>I prefer exhaustive complete subject syllabus reference catalogs.</span>
                  </div>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("style", "NONE")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem 1.5rem", height: "auto", display: "flex", alignItems: "center", gap: "1rem", borderRadius: "10px", border: "2px solid var(--border-color)", textAlign: "left" }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-tertiary)", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <HelpCircle size={20} style={{ margin: "0 auto" }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>No specific preference</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>I am open to whatever parameters are relevant for the title.</span>
                  </div>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget Range */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block" }}>Question 3 of 3</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.25rem 0 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Coins size={22} color="var(--brand-primary)" /> What is your targeted budget scope?
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <button 
                  onClick={() => handleAnswerSelect("budget", "BUDGET")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem", height: "auto", display: "flex", flexDirection: "column", gap: "0.25rem", borderRadius: "10px", border: "2px solid var(--border-color)" }}
                >
                  <strong style={{ fontSize: "1.1rem" }}>₹0 - ₹250</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Affordable reference study guides</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("budget", "STANDARD")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem", height: "auto", display: "flex", flexDirection: "column", gap: "0.25rem", borderRadius: "10px", border: "2px solid var(--border-color)" }}
                >
                  <strong style={{ fontSize: "1.1rem" }}>₹250 - ₹600</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Standard syllabus &amp; popular literature releases</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("budget", "PREMIUM")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem", height: "auto", display: "flex", flexDirection: "column", gap: "0.25rem", borderRadius: "10px", border: "2px solid var(--border-color)" }}
                >
                  <strong style={{ fontSize: "1.1rem" }}>₹600+</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Premium reference manuals &amp; complete syllabus sets</span>
                </button>

                <button 
                  onClick={() => handleAnswerSelect("budget", "ANY")}
                  className="btn btn-outline"
                  style={{ padding: "1.25rem", height: "auto", display: "flex", flexDirection: "column", gap: "0.25rem", borderRadius: "10px", border: "2px solid var(--border-color)" }}
                >
                  <strong style={{ fontSize: "1.1rem" }}>All Budgets</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Show me matches regardless of pricing metrics</span>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button type="button" onClick={() => setStep(2)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Loading & Analyzing */}
          {step === 4 && recommendations.length === 0 && (
            <div style={{ textAlign: "center", padding: "4rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: "64px", height: "64px", border: "4px solid #f1f5f9", borderTopColor: "var(--brand-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Compiling Recommendations...</h3>
                <p className="text-muted" style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
                  Analyzing {products.length} catalog items for category focus, delivery rules, and pricing matching weights...
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Display recommendations */}
          {step === 5 || (step === 4 && recommendations.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, color: "var(--brand-primary)", display: "block" }}>Results Generated</span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    🎯 Top Hand-Picked Recommendations for You
                  </h2>
                </div>
                <button 
                  onClick={resetQuiz}
                  className="btn btn-outline" 
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                >
                  <RotateCcw size={14} /> Retake Quiz
                </button>
              </div>

              {recommendations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No active products match your specific selections. Try resetting filters.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id} 
                      style={{ 
                        display: "flex", 
                        gap: "1.5rem", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: "12px", 
                        padding: "1.5rem", 
                        background: "#ffffff",
                        transition: "all 0.2s",
                        position: "relative",
                        flexWrap: "wrap"
                      }}
                      className="recommendation-card-hover"
                    >
                      {/* Match Score Badge Circle */}
                      <div style={{ 
                        position: "absolute", 
                        top: "-12px", 
                        right: "1.5rem", 
                        background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)", 
                        color: "#ffffff", 
                        padding: "0.35rem 0.75rem", 
                        borderRadius: "30px", 
                        fontWeight: 800, 
                        fontSize: "0.75rem", 
                        boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem"
                      }}>
                        <Sparkles size={12} /> {rec.matchScore}% Match
                      </div>

                      {/* Image cover preview */}
                      <Link 
                        href={`/products/${rec.id}`} 
                        style={{ 
                          width: "120px", 
                          height: "150px", 
                          background: "var(--bg-tertiary)", 
                          borderRadius: "8px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          flexShrink: 0,
                          padding: "0.5rem"
                        }}
                      >
                        <img 
                          src={rec.imageUrl || "/placeholder.jpg"} 
                          alt={rec.name} 
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      </Link>

                      {/* Detail Info panel */}
                      <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--brand-primary)", textTransform: "uppercase", fontWeight: 700 }}>
                              {rec.category?.name}
                            </span>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#cbd5e1" }}></span>
                            <span style={{ fontSize: "0.72rem", color: "var(--success)", fontWeight: 700 }}>
                              {rec.matchReason}
                            </span>
                          </div>
                          <Link href={`/products/${rec.id}`} style={{ textDecoration: "none" }}>
                            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }} className="hover-brand-color">
                              {rec.name}
                            </h3>
                          </Link>
                          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {rec.description}
                          </p>
                        </div>

                        {/* Specs strip */}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.68rem", background: "var(--bg-secondary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                            ⚖️ {rec.weight} kg
                          </span>
                          {rec.publisher && (
                            <span style={{ fontSize: "0.68rem", background: "var(--bg-secondary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                              🏢 {rec.publisher}
                            </span>
                          )}
                          {rec.fastDispatch && (
                            <span style={{ fontSize: "0.68rem", background: "var(--brand-glow)", color: "var(--brand-primary)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                              ✈️ Express Ship
                            </span>
                          )}
                        </div>

                        {/* Bottom Buy bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "1rem" }}>
                          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            ₹{rec.price.toFixed(2)}
                          </span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Link href={`/products/${rec.id}`} className="btn btn-outline" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              Details
                            </Link>
                            <HomeBuyButton product={rec} />
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .recommendation-card-hover:hover {
          border-color: rgba(14, 165, 233, 0.4) !important;
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.05) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
