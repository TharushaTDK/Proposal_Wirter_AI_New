// Landing.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
            {/* Main Content */}
            <div className="max-w-4xl mx-auto text-center">
                {/* Hero Section */}
                <div className="mb-16">
                    <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                        ProposalAI
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Transform your ideas into professional business proposals with AI-powered precision and speed.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
                        <p className="text-gray-600 text-sm">Generate professional proposals in minutes with advanced AI</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">💼</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Ready</h3>
                        <p className="text-gray-600 text-sm">Complete proposals with timelines, budgets, and explanations</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analytics</h3>
                        <p className="text-gray-600 text-sm">Track progress and optimize your proposal strategy</p>
                    </div>
                </div>

                {/* Authentication Buttons */}
                <div className="space-y-6 max-w-md mx-auto">
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                        <span>🔐</span>
                        Login to Your Account
                    </button>

                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-lg font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                        <span>✨</span>
                        Create New Account
                    </button>
                </div>

                {/* Demo Credentials */}
                <div className="mt-12 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Demo Credentials</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="text-left">
                            <p className="font-medium text-gray-700">John (Pro Plan)</p>
                            <p className="text-gray-600">Username: <span className="font-mono">john</span></p>
                            <p className="text-gray-600">Password: <span className="font-mono">proposal</span></p>
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-700">Peter (Free Plan)</p>
                            <p className="text-gray-600">Username: <span className="font-mono">peter</span></p>
                            <p className="text-gray-600">Password: <span className="font-mono">proposal</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-16 text-center">
                <p className="text-gray-500 text-sm">
                    Powered by AI • Secure • Professional
                </p>
            </footer>
        </div>
    );
}