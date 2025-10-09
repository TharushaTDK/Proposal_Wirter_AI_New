import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Make sure this package is installed

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <nav className="bg-gray-900 text-white fixed top-0 left-0 w-full shadow-md z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link
                    to="/"
                    className="text-2xl font-bold tracking-wide text-blue-400 hover:text-blue-300"
                >
                    ProposalAI
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-8 text-lg">
                    <Link to="/" className="hover:text-blue-400 transition">
                        Home
                    </Link>
                    <Link to="/history" className="hover:text-blue-400 transition">
                        History
                    </Link>
                    <Link to="/about" className="hover:text-blue-400 transition">
                        About Us
                    </Link>
                    <Link to="/support" className="hover:text-blue-400 transition">
                        Support
                    </Link>
                    <Link
                        to="/login"
                        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Login
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden focus:outline-none hover:text-blue-400"
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-gray-800 border-t border-gray-700">
                    <div className="flex flex-col items-center space-y-4 py-4 text-lg">
                        <Link
                            to="/"
                            onClick={toggleMenu}
                            className="hover:text-blue-400 transition"
                        >
                            Home
                        </Link>
                        <Link
                            to="/history"
                            onClick={toggleMenu}
                            className="hover:text-blue-400 transition"
                        >
                            History
                        </Link>
                        <Link
                            to="/about"
                            onClick={toggleMenu}
                            className="hover:text-blue-400 transition"
                        >
                            About Us
                        </Link>
                        <Link
                            to="/support"
                            onClick={toggleMenu}
                            className="hover:text-blue-400 transition"
                        >
                            Support
                        </Link>
                        <Link
                            to="/login"
                            onClick={toggleMenu}
                            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
