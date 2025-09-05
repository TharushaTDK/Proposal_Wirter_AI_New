import React, { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [requirements, setRequirements] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [expandedMap, setExpandedMap] = useState({});

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem("proposal_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveHistory = (prompt, result) => {
    const newEntry = { prompt, result, time: new Date().toLocaleString() };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    localStorage.setItem("proposal_history", JSON.stringify(newHistory));
  };

  const toggleExpanded = (pIdx, kIdx) => {
    const key = `${pIdx}_${kIdx}`;
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    if (!requirements.trim()) return;
    setLoading(true);
    setError("");
    setProposals([]);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements, num_proposals: 1 }),
      });

      if (!res.ok) throw new Error(`Analyzer error: ${res.statusText}`);
      const data = await res.json();

      if (!data.proposals) {
        setError("Invalid response from server.");
      } else {
        // Ensure full_draft exists
        const filledProposals = data.proposals.map(p => ({
          ...p,
          full_draft: p.full_draft || "Draft not generated yet.",
          feedback: p.feedback || "No feedback."
        }));
        setProposals(filledProposals);
        saveHistory(requirements, filledProposals);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch from backend. Ensure all agents are running.");
    }

    setLoading(false);
  };

  return (
    <div className="app-container flex h-screen font-sans text-black">
      {/* Sidebar */}
      <div className="history-sidebar w-1/4 bg-gray-100 p-4 overflow-y-auto border-r border-gray-300">
        <h2 className="font-bold mb-2 text-lg">🕘 History</h2>
        {history.length === 0 && <p className="text-black">No past searches.</p>}
        {history.map((h, idx) => (
          <div
            key={idx}
            className="mb-3 p-2 bg-white rounded shadow-sm cursor-pointer hover:bg-gray-50 text-black"
            onClick={() => setProposals(h.result)}
          >
            <p className="font-semibold truncate text-black">{h.prompt}</p>
            <p className="text-xs text-black">{h.time}</p>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="main-panel flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4 text-black">📝 Multi-Agent Proposal Writer</h1>

        <textarea
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-black resize-none"
          placeholder="Enter project requirements here..."
          rows={4}
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
          onClick={handleGenerate}
          disabled={loading || !requirements.trim()}
        >
          {loading ? "Analyzing..." : "Generate Proposal"}
        </button>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {proposals.length > 0 &&
          proposals.map((proposal, pIdx) => {
            const paragraphs = proposal.full_draft.split("\n\n");
            const intro = paragraphs[0] || "";
            const conclusion = paragraphs.slice(-1)[0] || "";
            const bodyParagraphs = paragraphs.slice(1, -1);

            return (
              <div key={pIdx} className="proposal-card border p-4 rounded-lg mb-6 shadow-sm bg-white text-black">
                <h2 className="text-xl font-bold mb-2 text-black">{proposal.title}</h2>
                <p className="font-semibold mb-2 text-black">{proposal.summary}</p>

                {/* Intro */}
                <div className="mb-3">
                  <h3 className="font-semibold text-black">Introduction</h3>
                  <p className="ml-4 mt-1 text-black whitespace-pre-wrap">{intro}</p>
                </div>

                {/* Key Points */}
                <div className="keypoints">
                  {proposal.key_points.map((kp, kIdx) => {
                    const paraText = bodyParagraphs[kIdx] || "";
                    const key = `${pIdx}_${kIdx}`;
                    const isExpanded = expandedMap[key] ?? true;

                    return (
                      <div key={kIdx} className="mb-3">
                        <h3
                          className="font-semibold cursor-pointer hover:text-blue-600 text-black"
                          onClick={() => toggleExpanded(pIdx, kIdx)}
                        >
                          {kIdx + 1}. {kp}
                        </h3>
                        {isExpanded && (
                          <p className="ml-4 mt-1 text-black whitespace-pre-wrap">{paraText}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Conclusion */}
                <div className="mb-3">
                  <h3 className="font-semibold text-black">Conclusion</h3>
                  <p className="ml-4 mt-1 text-black whitespace-pre-wrap">{conclusion}</p>
                </div>

                {/* Proofreader feedback */}
                {proposal.feedback && (
                  <div className="mt-2 p-2 border-t border-gray-300 text-sm text-black">
                    <strong>Proofreader Feedback:</strong> {proposal.feedback}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;
