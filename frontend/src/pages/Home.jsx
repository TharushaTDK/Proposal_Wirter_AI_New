import React, { useState, useEffect } from "react";

function Home() {
    const [requirements, setRequirements] = useState("");
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [history, setHistory] = useState([]);

    // Load history from local storage
    useEffect(() => {
        const savedHistory = localStorage.getItem("proposal_history");
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, []);

    // Save new proposal to history
    const saveHistory = (prompt, result) => {
        const newEntry = { prompt, result, time: new Date().toLocaleString() };
        const newHistory = [newEntry, ...history];
        setHistory(newHistory);
        localStorage.setItem("proposal_history", JSON.stringify(newHistory));
    };

    // Handle proposal generation
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
        <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-start pt-28 px-4 md:px-12">
            {/* Header */}
            <h1 className="text-3xl font-bold mb-6 text-center">📝 Multi-Agent Proposal Writer</h1>

            {/* Requirements Input */}
            <textarea
                className="w-full p-6 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-black resize-none text-lg"
                placeholder="Enter project requirements here..."
                rows={6}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
            />

            <button
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
                onClick={handleGenerate}
                disabled={loading || !requirements.trim()}
            >
                {loading ? "Analyzing..." : "Generate Proposal"}
            </button>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Display Proposals */}
            {proposals.map((proposal, pIdx) => (
                <div
                    key={pIdx}
                    className="proposal-report bg-white text-black p-8 mb-12 shadow-lg rounded-lg w-full max-w-full"
                >
                    <h1 className="text-3xl font-bold mb-6 text-center">{proposal.title}</h1>
                    <p className="text-lg mb-8">{proposal.summary}</p>

                    {/* Table of Contents */}
                    {proposal.sections && proposal.sections.length > 0 && (
                        <div className="mb-8 p-6 border rounded bg-gray-100">
                            <h2 className="text-2xl font-semibold mb-4">📑 Table of Contents</h2>
                            <ol className="list-decimal ml-6">
                                {proposal.sections.map((sec, sIdx) => (
                                    <li
                                        key={sIdx}
                                        className="mb-2 cursor-pointer text-blue-600 hover:underline"
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
                    )}

                    {/* Proposal Sections */}
                    {proposal.sections &&
                        proposal.sections.map((sec, sIdx) => (
                            <div
                                key={sIdx}
                                id={`section-${pIdx}-${sIdx}`}
                                className="proposal-section mb-12 break-after-page"
                            >
                                <h2 className="text-2xl font-semibold mb-4">{sec.title}</h2>
                                <p className="text-base whitespace-pre-wrap text-black">{sec.content}</p>
                            </div>
                        ))}
                </div>
            ))}
        </div>
    );
}

export default Home;
