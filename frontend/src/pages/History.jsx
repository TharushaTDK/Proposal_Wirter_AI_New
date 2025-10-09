import React, { useState, useEffect } from "react";

const History = ({ history, setProposals, setHistory }) => {
    const [activeIndex, setActiveIndex] = useState(null);

    // Load history from localStorage if not already loaded
    useEffect(() => {
        const savedHistory = localStorage.getItem("proposal_history");
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, [setHistory]);

    // Handle selecting a tab
    const handleLoad = (index) => {
        setActiveIndex(index);
        if (history[index]?.result) setProposals(history[index].result);
    };

    // Handle deleting a tab
    const handleDelete = (index) => {
        const newHistory = history.filter((_, i) => i !== index);
        setHistory(newHistory);
        localStorage.setItem("proposal_history", JSON.stringify(newHistory));

        // If deleted tab was active, clear proposals
        if (index === activeIndex) {
            setActiveIndex(null);
            setProposals([]);
        } else if (index < activeIndex) {
            setActiveIndex((prev) => prev - 1);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-900 text-white">
            <h2 className="text-3xl font-bold mb-6">🕘 Proposal History</h2>

            {history.length === 0 ? (
                <p className="text-gray-300">No past searches yet.</p>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Tabs / History List */}
                    <div className="md:w-1/4 flex flex-col space-y-2">
                        {history.map((entry, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-lg shadow text-left transition
                                    ${activeIndex === idx
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-black hover:bg-gray-100"
                                    }`}
                            >
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleLoad(idx)}
                                >
                                    <p className="w-40 font-semibold truncate">{entry.prompt}</p>
                                    <p className="text-sm text-gray-500 mt-1">{entry.time}</p>
                                </div>
                                <button
                                    className="ml-2 text-red-600 hover:text-red-800 font-semibold"
                                    onClick={() => handleDelete(idx)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Selected Proposal Display */}
                    <div className="md:w-3/4 flex-1">
                        {activeIndex !== null && history[activeIndex]?.result.length > 0 ? (
                            history[activeIndex].result.map((proposal, pIdx) => (
                                <div
                                    key={pIdx}
                                    className="proposal-report bg-white text-black p-6 md:p-8 mb-12 shadow-lg rounded-lg w-full max-w-full"
                                >
                                    <h1 className="text-3xl font-bold mb-6 text-center">{proposal.title}</h1>
                                    <p className="text-lg mb-6">{proposal.summary}</p>

                                    {/* Table of Contents */}
                                    {proposal.sections && proposal.sections.length > 0 && (
                                        <div className="mb-6 p-4 border rounded bg-gray-100">
                                            <h2 className="text-2xl font-semibold mb-3">📑 Table of Contents</h2>
                                            <ol className="list-decimal ml-6 space-y-1">
                                                {proposal.sections.map((sec, sIdx) => (
                                                    <li
                                                        key={sIdx}
                                                        className="cursor-pointer text-blue-600 hover:underline"
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
                                                className="proposal-section mb-8"
                                            >
                                                <h2 className="text-2xl font-semibold mb-2">{sec.title}</h2>
                                                <p className="text-base whitespace-pre-wrap text-black">{sec.content}</p>
                                            </div>
                                        ))}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-300 mt-4">Select a history item to view the proposal.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
