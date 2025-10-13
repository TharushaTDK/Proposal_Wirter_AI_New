// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // User database (in real app, this would be a backend)
    const users = {
        'john': { password: "proposal", plan: "pro" },
        'peter': { password: "proposal", plan: "free" }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Trim whitespace and convert to lowercase
        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();

        console.log("Login attempt:", { cleanUsername, cleanPassword }); // Debug log

        const user = users[cleanUsername];

        console.log("Found user:", user); // Debug log

        if (user && user.password === cleanPassword) {
            console.log("Login successful!"); // Debug log
            // Store user info in localStorage
            localStorage.setItem("currentUser", JSON.stringify({
                username: cleanUsername,
                plan: user.plan
            }));
            navigate("/home");
        } else {
            console.log("Login failed - invalid credentials"); // Debug log
            setError("Invalid username or password. Use: john/proposal or peter/proposal");
        }

        setLoading(false);
    };

    // Test function to check user object
    const testUserCredentials = () => {
        console.log("Testing user credentials:");
        console.log("users['john']:", users['john']);
        console.log("users['peter']:", users['peter']);
        console.log("users['john'] password:", users['john']?.password);
        console.log("users['peter'] password:", users['peter']?.password);
    };

    // Call test on component mount
    React.useEffect(() => {
        testUserCredentials();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Back to Landing */}
                <button
                    onClick={() => navigate("/")}
                    className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <span>←</span>
                    Back to Home
                </button>

                {/* Login Card */}
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600">Sign in to your ProposalAI account</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-gray-50"
                                placeholder="Enter your username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-gray-50"
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <span>🔐</span>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Test Buttons */}
                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setUsername("john");
                                setPassword("proposal");
                            }}
                            className="flex-1 text-xs px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                            Fill John
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername("peter");
                                setPassword("proposal");
                            }}
                            className="flex-1 text-xs px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            Fill Peter
                        </button>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Demo Credentials:</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                            <p><strong>John (Pro):</strong> john / proposal</p>
                            <p><strong>Peter (Free):</strong> peter / proposal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}