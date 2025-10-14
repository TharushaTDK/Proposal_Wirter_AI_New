import React, { useEffect, useState } from "react";

/**
 * Home.jsx - Enhanced UI with Login Integration
 * - Modern light theme with improved spacing and typography
 * - Better visual hierarchy and cleaner layout
 * - Enhanced color scheme and interactions
 * - History stores only completed proposals with all sections
 * - Frontend-only delete functionality
 * - User authentication and plan display
 * - All backend integrations preserved
 */

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

export default function Home() {
    // main states
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [requirements, setRequirements] = useState("");
    const [proposal, setProposal] = useState(null);
    const [explanations, setExplanations] = useState([]);
    const [guidance, setGuidance] = useState("");
    const [budgetPlan, setBudgetPlan] = useState("");

    // UI states
    const [loading, setLoading] = useState(false);
    const [autoExplaining, setAutoExplaining] = useState(false);
    const [explainDone, setExplainDone] = useState(false);
    const [guidanceLoading, setGuidanceLoading] = useState(false);
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [error, setError] = useState("");

    // history
    const [history, setHistory] = useState([]);
    const [activeHistoryId, setActiveHistoryId] = useState(null);

    // Track completion state
    const [isCompleteProposal, setIsCompleteProposal] = useState(false);

    // User authentication state
    const [currentUser, setCurrentUser] = useState(null);

    // Check authentication on component mount
    useEffect(() => {
        const userData = localStorage.getItem("currentUser");
        if (!userData) {
            window.location.href = "/";
            return;
        }
        setCurrentUser(JSON.parse(userData));
    }, []);

    // Check if current proposal is complete
    useEffect(() => {
        const complete = proposal && explanations.length > 0 && guidance && budgetPlan;
        setIsCompleteProposal(!!complete);

        // Auto-save to history when all sections are complete
        if (complete && !activeHistoryId) {
            saveCompleteProposalToHistory();
        }
    }, [proposal, explanations, guidance, budgetPlan]);

    // fetch history on mount
    useEffect(() => {
        fetchHistory();
        // close sidebar on small screens
        const mql = window.matchMedia("(max-width: 768px)");
        setSidebarOpen(!mql.matches); // open on desktop, closed on small
        const handler = (e) => setSidebarOpen(!e.matches);
        mql.addEventListener?.("change", handler);
        return () => mql.removeEventListener?.("change", handler);
    }, []);

    async function fetchHistory() {
        try {
            const res = await fetch("http://127.0.0.1:8004/history");
            if (!res.ok) throw new Error("Failed to load history");
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err) {
            console.error("history fetch error:", err);
            setHistory([]);
        }
    }

    // Delete history item - FRONTEND ONLY
    function deleteHistoryItem(id, event) {
        event.stopPropagation(); // Prevent triggering the load function
        if (!id) return;

        // Remove from local state immediately
        setHistory(prev => prev.filter(item => item.id !== id));

        // If the deleted item was active, clear the view
        if (activeHistoryId === id) {
            setActiveHistoryId(null);
            setRequirements("");
            setProposal(null);
            setExplanations([]);
            setGuidance("");
            setBudgetPlan("");
            setIsCompleteProposal(false);
        }
    }

    // Save only complete proposals to history
    async function saveCompleteProposalToHistory() {
        if (!proposal || !guidance || !budgetPlan || explanations.length === 0) {
            return;
        }

        try {
            const record = {
                title: proposal.title || "Untitled Proposal",
                requirements,
                proposal,
                explanations,
                guidance,
                budget_plan: budgetPlan,
            };

            const res = await fetch("http://127.0.0.1:8004/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });

            if (!res.ok) {
                const t = await res.text();
                console.error("save history failed:", t);
                return;
            }

            const data = await res.json();
            await fetchHistory(); // Refresh history list
            setActiveHistoryId(data.entry?.id || null);
            return data.entry;
        } catch (err) {
            console.error("save history error:", err);
        }
    }

    // load a history item into UI
    function loadHistoryItem(item) {
        setActiveHistoryId(item.id);
        setRequirements(item.requirements || "");
        setProposal(item.proposal || null);
        setExplanations(item.explanations || []);
        setGuidance(item.guidance || "");
        setBudgetPlan(item.budget_plan || "");
        setExplainDone(Boolean(item.explanations && item.explanations.length > 0));
        setIsCompleteProposal(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Generate proposal (analyze agent)
    async function handleGenerateProposal() {
        if (!requirements.trim()) return;
        setLoading(true);
        setError("");
        setProposal(null);
        setExplanations([]);
        setGuidance("");
        setBudgetPlan("");
        setExplainDone(false);
        setActiveHistoryId(null);
        setIsCompleteProposal(false);

        try {
            const res = await fetch("http://127.0.0.1:8000/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requirements }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Backend error");
            }
            const data = await res.json();
            const p = data.proposals?.[0] ?? null;
            setProposal(p);

        } catch (err) {
            console.error(err);
            setError("Failed to generate proposal: " + (err.message || err));
        }
        setLoading(false);
    }

    // Auto explain all points (calls explain_point for each point)
    async function handleAutoExplain() {
        if (!proposal) return;
        setAutoExplaining(true);
        setError("");
        setExplanations([]);
        const pts = Array.isArray(proposal.point_of_view)
            ? proposal.point_of_view
            : (String(proposal.point_of_view || "")).split("\n").filter((p) => p.trim() !== "");
        const collected = [];

        for (let i = 0; i < pts.length; i++) {
            const rawPoint = String(pts[i]).replace(/^•\s*/, "").trim();
            try {
                const payload = {
                    title: String(proposal.title || ""),
                    introduction: String(proposal.introduction || ""),
                    point: rawPoint,
                };
                const res = await fetch("http://127.0.0.1:8001/explain_point", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || "explain_point error");
                }
                const data = await res.json();
                collected.push({ point: rawPoint, explanation: data.explanation || "" });
                setExplanations([...collected]); // live update
                // small delay to avoid bursts
                await new Promise((r) => setTimeout(r, 1000));
            } catch (err) {
                console.error("explain error:", err);
                setError("Explain failed: " + (err.message || err));
                break;
            }
        }

        setAutoExplaining(false);
        setExplainDone(true);
    }

    // Guidance generation - ONLY FOR PRO USERS
    async function handleGuidance() {
        // Check if user is on Pro plan
        if (currentUser?.plan !== 'pro') {
            setError("Please upgrade to Pro plan to access Project Timeline features!");
            return;
        }

        if (!proposal) return;
        setGuidanceLoading(true);
        setError("");
        setGuidance("");

        try {
            const tableOfContents = Array.isArray(proposal.point_of_view)
                ? proposal.point_of_view.map((p) => (String(p).replace(/^•\s*/, "").trim()))
                : String(proposal.point_of_view || "").split("\n").filter((p) => p.trim() !== "");

            const payload = { title: String(proposal.title || ""), table_of_contents: tableOfContents };
            const res = await fetch("http://127.0.0.1:8002/generate_guidance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "guidance error");
            }
            const data = await res.json();
            setGuidance(data.guidance || "");

        } catch (err) {
            console.error(err);
            setError("Guidance failed: " + (err.message || err));
        }
        setGuidanceLoading(false);
    }

    // Budget & Conclusion generation
    async function handleBudget() {
        if (!proposal || !guidance) return;
        setBudgetLoading(true);
        setError("");
        setBudgetPlan("");

        try {
            const tableOfContents = Array.isArray(proposal.point_of_view)
                ? proposal.point_of_view.map((p) => (String(p).replace(/^•\s*/, "").trim()))
                : String(proposal.point_of_view || "").split("\n").filter((p) => p.trim() !== "");

            const payload = {
                title: String(proposal.title || ""),
                table_of_contents: tableOfContents,
                explanations: explanations.map((e) => e.explanation),
                timeline: guidance,
            };

            const res = await fetch("http://127.0.0.1:8003/generate_budget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "budget error");
            }
            const data = await res.json();
            setBudgetPlan(data.budget_plan || "");

        } catch (err) {
            console.error(err);
            setError("Budget generation failed: " + (err.message || err));
        }
        setBudgetLoading(false);
    }

    // Manually save current progress to history
    async function handleManualSave() {
        if (isCompleteProposal) {
            // Already saved automatically
            return;
        }

        try {
            const record = {
                title: (proposal?.title || requirements.slice(0, 40) + (requirements.length > 40 ? "..." : "") || "Draft Proposal"),
                requirements,
                proposal: proposal || null,
                explanations: explanations || [],
                guidance: guidance || "",
                budget_plan: budgetPlan || "",
            };

            const res = await fetch("http://127.0.0.1:8004/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record),
            });

            if (res.ok) {
                await fetchHistory();
                // Show success feedback
                setError(""); // Clear any previous errors
            }
        } catch (err) {
            console.error("Manual save error:", err);
            setError("Failed to save draft: " + (err.message || err));
        }
    }

    // Handle logout
    function handleLogout() {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
    }

    // UI render helpers
    function renderProposalCard() {
        if (!proposal) return null;
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {proposal.title}
                    </h1>
                    {isCompleteProposal && (
                        <div className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Points of View
                    </h3>
                    <ul className="space-y-3 ml-4">
                        {(Array.isArray(proposal.point_of_view)
                            ? proposal.point_of_view
                            : String(proposal.point_of_view || "").split("\n")
                        )
                            .filter((p) => p && p.trim())
                            .map((pt, i) => (
                                <li key={i} className="text-gray-700 leading-relaxed flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 flex-shrink-0"></span>
                                    <span>{String(pt).replace(/^•\s*/, "")}</span>
                                </li>
                            ))}
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Introduction
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {proposal.introduction}
                    </p>
                </div>

                {/* Explain Button (appears under proposal) */}
                {!explainDone && (
                    <div className="mt-8 flex justify-center">
                        <button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                            onClick={handleAutoExplain}
                            disabled={autoExplaining}
                        >
                            {autoExplaining ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Explaining Points...
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    Explain All Points
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Progress indicator
    function renderProgressIndicator() {
        const steps = [
            { label: 'Proposal', completed: !!proposal },
            { label: 'Explained', completed: explanations.length > 0 },
            { label: 'Guidance', completed: !!guidance },
            { label: 'Budget', completed: !!budgetPlan },
        ];

        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Progress</h3>
                    {isCompleteProposal ? (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete - Saved to History
                        </span>
                    ) : (
                        <button
                            onClick={handleManualSave}
                            className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Draft
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.label} className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${step.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                                }`}>
                                {step.completed ? '✓' : index + 1}
                            </div>
                            <span className={`text-xs font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // In the renderUpgradeMessage function, update the button to navigate to update_plan
    function renderUpgradeMessage() {
        return (
            <div className="mt-8 flex justify-center">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 max-w-md text-center">
                    <div className="text-4xl mb-3">🚀</div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Upgrade to Pro Plan</h3>
                    <p className="text-gray-600 mb-4">
                        Get access to advanced features like Project Timeline generation, detailed resource planning, and more!
                    </p>
                    <button
                        onClick={() => window.location.href = "/update_plan"}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 text-gray-900 flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg transition-transform duration-300 z-30
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-80 md:translate-x-0`}
            >
                <div className="h-full flex flex-col">
                    {/* User Info Section - ADDED */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {currentUser?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate capitalize">
                                    {currentUser?.username}
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full font-medium ${currentUser?.plan === 'pro'
                                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700'
                                    }`}>
                                    {currentUser?.plan === 'pro' ? '✨ Pro Plan' : '🆓 Free Plan'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Completed Proposals</h2>
                                <p className="text-sm text-gray-500 mt-1">Your saved complete proposals</p>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600 md:hidden transition-colors p-2 hover:bg-gray-100 rounded-lg"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        {/* New Session button */}
                        <div className="px-2">
                            <button
                                onClick={() => {
                                    setRequirements("");
                                    setProposal(null);
                                    setExplanations([]);
                                    setGuidance("");
                                    setBudgetPlan("");
                                    setActiveHistoryId(null);
                                    setIsCompleteProposal(false);
                                }}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Proposal
                            </button>
                        </div>

                        {/* History list */}
                        <div className="mt-4 space-y-3">
                            {history.length === 0 && (
                                <div className="text-center py-8 px-4">
                                    <div className="text-gray-400 mb-2">📝</div>
                                    <div className="text-sm text-gray-500">No completed proposals yet</div>
                                    <div className="text-xs text-gray-400 mt-1">Complete all sections to save here</div>
                                </div>
                            )}

                            {history.map((h) => (
                                <div
                                    key={h.id}
                                    className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border relative group
                    ${activeHistoryId === h.id
                                            ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 shadow-md"
                                            : "bg-white/80 border-gray-200/80 hover:bg-white hover:shadow-md hover:border-gray-300"
                                        }`}
                                    onClick={() => loadHistoryItem(h)}
                                >
                                    {/* Delete Button - FRONTEND ONLY */}
                                    <button
                                        onClick={(e) => deleteHistoryItem(h.id, e)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-md z-10"
                                        title="Delete this proposal"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>

                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="text-sm font-semibold text-gray-900 truncate mb-1">{h.title}</div>
                                            <div className="text-xs text-gray-500 truncate">{(h.requirements || "").slice(0, 70)}</div>
                                        </div>
                                        <div className="text-xs text-gray-400 text-right flex-shrink-0">
                                            <div>{formatDate(h.timestamp)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Complete</span>
                                        {h.proposal && <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">Proposal</span>}
                                        {h.explanations?.length > 0 && <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Explained</span>}
                                        {h.guidance && <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Guidance</span>}
                                        {h.budget_plan && <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">Budget</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                        <div className="text-xs text-gray-600 space-y-2">
                            <div className="font-medium text-gray-700 mb-2">💡 Tips</div>
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                Proposals auto-save when all sections are complete
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                Use "Save Draft" to save incomplete work
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                Click the × icon to delete proposals (frontend only)
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile menu button */}
            <div className="md:hidden fixed top-4 left-4 z-40">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="bg-white rounded-xl p-3 shadow-lg text-gray-700 hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    aria-label="Open sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Main content */}
            <main className="flex-1 ml-0 md:ml-80 min-h-screen p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header - UPDATED WITH USER INFO */}
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                                Proposal Writer AI
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-gray-600">
                                    Welcome back, <span className="font-semibold text-blue-600 capitalize">{currentUser?.username}</span>!
                                </p>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${currentUser?.plan === 'pro'
                                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                                    }`}>
                                    {currentUser?.plan === 'pro' ? '✨ Pro Plan' : '🆓 Free Plan'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleLogout}
                                className="text-sm px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium"
                            >
                                Logout
                            </button>
                            <button
                                className="text-sm px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium"
                                onClick={() => {
                                    setRequirements("");
                                    setProposal(null);
                                    setExplanations([]);
                                    setGuidance("");
                                    setBudgetPlan("");
                                    setError("");
                                    setActiveHistoryId(null);
                                    setIsCompleteProposal(false);
                                }}
                            >
                                Reset All
                            </button>
                        </div>
                    </header>

                    {/* Progress Indicator */}
                    {(proposal || explanations.length > 0 || guidance || budgetPlan) && renderProgressIndicator()}

                    {/* Input card */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
                        <label className="block text-lg font-semibold text-gray-900 mb-4">Project Requirements</label>
                        <textarea
                            rows={6}
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="Paste or type your project requirements here... 
Example: 'I need a mobile app for task management with user authentication, real-time notifications, and cloud sync.'"
                            className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none bg-gray-50/50 hover:bg-gray-50"
                        />

                        <div className="mt-6 flex items-center gap-4 flex-wrap">
                            <button
                                onClick={handleGenerateProposal}
                                disabled={loading || !requirements.trim()}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        Generate Proposal
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setRequirements(`System Development Proposal
📍 Point of View
Client requires a user-friendly hotel booking system
System should allow guests to search for available rooms based on dates and preferences
Clients want to be able to make reservations online with secure payment options
Integration with existing hotel management software is necessary
System must have a responsive design for mobile and desktop users

📘 Introduction
Our proposed solution for the hotel booking system aims to meet all the requirements outlined by the client.`);
                                }}
                                className="text-sm px-5 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium"
                            >
                                Use Sample
                            </button>

                            {isCompleteProposal && (
                                <div className="ml-auto text-sm text-green-600 font-medium flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Saved to history
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </section>

                    {/* Proposal card */}
                    {renderProposalCard()}

                    {/* Explanations card */}
                    {explanations.length > 0 && (
                        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
                            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                Detailed Explanations
                            </h3>

                            <div className="space-y-6">
                                {explanations.map((it, i) => (
                                    <div key={i} className="p-5 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-300 hover:bg-white">
                                        <div className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                            <span className="text-blue-600">{i + 1}.</span>
                                            {it.point}
                                        </div>
                                        <div className="space-y-3">
                                            {it.explanation.split(/\n\s*\n/).map((para, pi) => (
                                                <p key={pi} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                    {para.trim()}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Guidance button below explanations - SHOW UPGRADE MESSAGE FOR FREE USERS */}
                            {!guidance && (
                                <div className="mt-8">
                                    {currentUser?.plan === 'pro' ? (
                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleGuidance}
                                                disabled={guidanceLoading}
                                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {guidanceLoading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Generating Timeline...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📅</span>
                                                        Get Project Timeline
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        renderUpgradeMessage()
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Guidance card */}
                    {guidance && (
                        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 transition-all duration-300 hover:shadow-md">
                            <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                Project Timeline Guidance
                            </h3>

                            <div className="space-y-4">
                                {guidance.split(/(?=Week\s+\d+:)/).map((block, idx) => {
                                    const lines = block.trim().split("\n").filter(Boolean);
                                    if (lines.length === 0) return null;
                                    const [title, ...tasks] = lines;
                                    return (
                                        <div key={idx} className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 transition-all duration-300 hover:shadow-md">
                                            <div className="font-bold text-gray-800 mb-3 text-lg">{title.trim()}</div>
                                            <ul className="space-y-2 ml-4">
                                                {tasks.map((t, j) => (
                                                    <li key={j} className="text-gray-700 flex items-start gap-3">
                                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                                        <span>{t.replace(/^[-•]\s*/, "").trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Budget button */}
                            {!budgetPlan && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={handleBudget}
                                        disabled={budgetLoading}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {budgetLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Generating Resources...
                                            </>
                                        ) : (
                                            <>
                                                <span>💰</span>
                                                Generate Resources & Conclusion
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Budget & Conclusion */}
                    {budgetPlan && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-16 transition-all duration-300 hover:shadow-md">
                            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                                Resources & Final Conclusion
                            </h2>

                            {(() => {
                                const sections = budgetPlan.split("Final Conclusion:");
                                const budgetSection = sections[0] || "";
                                const conclusionSection = sections[1] || "";

                                console.log("Budget Section:", budgetSection); // Debug log

                                // Extract all weeks using a more robust method
                                const weeks = [];
                                const weekMatches = budgetSection.matchAll(/Week\s+\d+:/gi);

                                let lastIndex = 0;
                                for (const match of weekMatches) {
                                    const weekStart = match.index;
                                    const weekTitle = match[0];

                                    // Find the next week or end of section
                                    const nextWeekMatch = /Week\s+\d+:/gi.exec(budgetSection.slice(weekStart + weekTitle.length));
                                    const weekEnd = nextWeekMatch ? weekStart + weekTitle.length + nextWeekMatch.index : budgetSection.length;

                                    const weekContent = budgetSection.slice(weekStart, weekEnd).trim();
                                    weeks.push(weekContent);
                                    lastIndex = weekEnd;
                                }

                                console.log("Found weeks:", weeks.length); // Debug log

                                return (
                                    <>
                                        {/* Render all weeks */}
                                        {weeks.map((weekContent, wIdx) => {
                                            const lines = weekContent.split('\n').filter(line => line.trim());
                                            if (lines.length === 0) return null;

                                            const weekTitle = lines[0];
                                            const taskLines = lines.slice(1);

                                            // Group tasks (each task has 4 lines: Task, Roles, Hours, Cost)
                                            const tasks = [];
                                            let currentTask = {};

                                            taskLines.forEach(line => {
                                                const cleanLine = line.replace(/^[-•]\s*/, "").trim();

                                                if (cleanLine.toLowerCase().startsWith('task:')) {
                                                    // If we have a complete previous task, save it
                                                    if (currentTask.task) {
                                                        tasks.push({ ...currentTask });
                                                    }
                                                    currentTask = {
                                                        task: cleanLine.replace('Task:', '').replace(/^task:/i, '').trim(),
                                                        roles: '',
                                                        hours: '',
                                                        cost: ''
                                                    };
                                                } else if (cleanLine.toLowerCase().startsWith('roles:')) {
                                                    currentTask.roles = cleanLine.replace('Roles:', '').replace(/^roles:/i, '').trim();
                                                } else if (cleanLine.toLowerCase().includes('hour')) {
                                                    currentTask.hours = cleanLine.replace(/Hours?:/i, '').trim();
                                                } else if (cleanLine.toLowerCase().includes('cost')) {
                                                    currentTask.cost = cleanLine.replace(/Cost:?/i, '').trim();
                                                }
                                            });

                                            // Don't forget the last task
                                            if (currentTask.task) {
                                                tasks.push({ ...currentTask });
                                            }

                                            return (
                                                <div key={wIdx} className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                                                    <h3 className="text-xl font-semibold text-amber-800 mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                        {weekTitle.replace(':', '')}
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {tasks.map((task, tIdx) => (
                                                            <div key={tIdx} className="p-4 bg-white rounded-lg border border-amber-100 shadow-sm">
                                                                <div className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                                                                    <span>📝</span>
                                                                    {task.task}
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                                    <div className="text-gray-700 flex items-center gap-2">
                                                                        <span>👥</span>
                                                                        <span><strong>Roles:</strong> {task.roles}</span>
                                                                    </div>
                                                                    <div className="text-gray-700 flex items-center gap-2">
                                                                        <span>⏱️</span>
                                                                        <span><strong>Hours:</strong> {task.hours}</span>
                                                                    </div>
                                                                    <div className="text-gray-700 flex items-center gap-2">
                                                                        <span>💰</span>
                                                                        <span><strong>Cost:</strong> {task.cost}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Render conclusion */}
                                        {conclusionSection && (
                                            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    Final Conclusion
                                                </h3>
                                                <div className="space-y-4">
                                                    {conclusionSection
                                                        .trim()
                                                        .split(/\n\s*\n/)
                                                        .filter(para => para.trim())
                                                        .map((para, pIdx) => (
                                                            <p key={pIdx} className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                                {para.trim()}
                                                            </p>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}