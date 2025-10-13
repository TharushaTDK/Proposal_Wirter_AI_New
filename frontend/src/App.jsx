import React from "react";
import Home from "./Home";
import ErrorBoundary from "../src/components/ErrorBoundary.jsx";

function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

export default App;
