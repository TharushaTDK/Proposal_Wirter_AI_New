import React, { useState, useEffect } from "react";
import "./index.css";
import Navbar from "./components/Navbar";

function App() {
  const [requirements, setRequirements] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

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

      if (!data.proposals) setError("Invalid response from server.");
      else {
        setProposals(data.proposals);
        saveHistory(requirements, data.proposals);
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
        <h1 className="text-2xl font-bold mb-4 text-white">📝 Multi-Agent Proposal Writer</h1>

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

        {proposals.map((proposal, pIdx) => (
          <div
            key={pIdx}
            className="proposal-report bg-white text-black p-6 mb-6 shadow-lg rounded-lg max-w-4xl mx-auto"
          >
            <h1 className="text-3xl font-bold mb-4 text-center">{proposal.title}</h1>
            <p className="text-lg mb-6">{proposal.summary}</p>

            {/* Table of Contents */}
            <div className="mb-8 p-4 border rounded bg-gray-100">
              <h2 className="text-2xl font-semibold mb-2">📑 Table of Contents</h2>
              <ol className="list-decimal ml-6">
                {(proposal.sections || []).map((sec, sIdx) => (
                  <li
                    key={sIdx}
                    className="mb-1 cursor-pointer text-blue-600 hover:underline"
                    onClick={() =>
                      document
                        .getElementById(`section-${pIdx}-${sIdx}`)
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    {sec.title}
                  </li>
                ))}
              </ol>
            </div>

            {/* Sections */}
            {(proposal.sections || []).map((sec, sIdx) => (
              <div
                key={sIdx}
                id={`section-${pIdx}-${sIdx}`}
                className="proposal-section mb-8 break-after-page"
              >
                <h2 className="text-2xl font-semibold mb-3">{sec.title}</h2>
                <p className="text-base whitespace-pre-wrap">{sec.content}</p>
              </div>
            ))}


          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
