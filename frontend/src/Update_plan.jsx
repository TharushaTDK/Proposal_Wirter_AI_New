import React from "react";

export default function UpdatePlan() {
    const handlePlanSelect = (plan) => {
        // Update user plan in localStorage
        const userData = localStorage.getItem("currentUser");
        if (userData) {
            const user = JSON.parse(userData);
            user.plan = plan;
            localStorage.setItem("currentUser", JSON.stringify(user));
        }

        // Navigate to login
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent mb-4">
                        Change your plan!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Choose the plan that works best for you
                    </p>
                </div>

                {/* Plans Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Free Plan */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl text-white">🆓</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Plan</h3>
                            <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                            <div className="text-gray-500 mb-6">forever</div>

                            <ul className="text-gray-600 space-y-3 mb-8 text-left">
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Basic proposal generation
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Point explanations
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-gray-400">Project timeline guidance</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-gray-400">Advanced resource planning</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span className="text-gray-400">Priority support</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => handlePlanSelect('free')}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Select Free Plan
                            </button>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-8 text-white transition-all duration-300 hover:scale-105 relative overflow-hidden">
                        {/* Popular Badge */}
                        <div className="absolute top-6 right-6 bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-bold">
                            POPULAR
                        </div>

                        <div className="text-center relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Pro Plan</h3>
                            <div className="text-4xl font-bold mb-2">$29</div>
                            <div className="text-white/80 mb-6">per month</div>

                            <ul className="text-white/90 space-y-3 mb-8 text-left">
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Everything in Free Plan
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Advanced project timeline guidance
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Detailed resource planning
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Budget & cost analysis
                                </li>
                                <li className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Priority customer support
                                </li>
                            </ul>

                            <button
                                onClick={() => handlePlanSelect('pro')}
                                className="w-full bg-white text-purple-600 hover:bg-gray-100 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                Select Pro Plan
                            </button>
                        </div>

                        {/* Background decoration */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <div className="absolute top-10 right-10 w-20 h-20 bg-white rounded-full"></div>
                            <div className="absolute bottom-10 left-10 w-16 h-16 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="text-center mt-8 text-gray-500">
                    <p>You'll be redirected to login after selecting your plan</p>
                </div>
            </div>
        </div>
    );
}