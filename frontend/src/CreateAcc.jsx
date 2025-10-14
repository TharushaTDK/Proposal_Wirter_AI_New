import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateAcc() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        plan: "free"
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setMessage("Password must be at least 6 characters long!");
            setLoading(false);
            return;
        }

        // Simulate account creation process
        setTimeout(() => {
            // Save user data to localStorage
            const userData = {
                username: formData.username,
                email: formData.email,
                plan: formData.plan,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem("currentUser", JSON.stringify(userData));

            setMessage("Account created successfully! Redirecting to login...");
            setLoading(false);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => navigate("/")}
                        className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2 justify-center"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </button>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                        Create Account
                    </h1>
                    <p className="text-gray-600">
                        Join ProposalAI and start creating professional proposals
                    </p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className={`p-4 rounded-2xl mb-6 text-center ${message.includes("successfully")
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}>
                        {message}
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
                    <div className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Confirm your password"
                            />
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Plan
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, plan: "free" })}
                                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${formData.plan === "free"
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                        }`}
                                >
                                    <div className="font-semibold">Free Plan</div>
                                    <div className="text-xs text-gray-500">$0/month</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, plan: "pro" })}
                                    className={`p-3 rounded-xl border-2 transition-all duration-300 ${formData.plan === "pro"
                                            ? "border-purple-500 bg-purple-50 text-purple-700"
                                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                        }`}
                                >
                                    <div className="font-semibold">Pro Plan</div>
                                    <div className="text-xs text-gray-500">$29/month</div>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    Create Account
                                </>
                            )}
                        </button>
                    </div>

                    {/* Login Link */}
                    <div className="text-center mt-6">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}