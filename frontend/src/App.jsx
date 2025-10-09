import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Support from "./pages/Support";
import History from "./pages/History";
import Navbar from "./components/Navbar";
import { useState, useEffect } from "react";

function App() {
  // History state lifted to App to pass to History page
  const [history, setHistory] = useState([]);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("proposal_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home setHistory={setHistory} />} />
        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />
        <Route
          path="/history"
          element={<History history={history} setProposals={setProposals} setHistory={setHistory} />}
        />
      </Routes>
    </div>
  );
}

export default App;
