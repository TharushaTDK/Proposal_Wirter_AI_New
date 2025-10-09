import React from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-blue-600 text-white shadow-lg fixed w-full z-50 top-0 left-0">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                {/* Logo */}
                <div className="text-2xl font-bold tracking-wide">
                    Hotel<span className="text-yellow-300">Booking</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-8">
                    <Link to="/" className="hover:text-yellow-300 transition duration-200">Home</Link>
                    <Link to="/history" className="hover:text-yellow-300 transition duration-200">History</Link>
                    <Link to="/about" className="hover:text-yellow-300 transition duration-200">About Us</Link>
                    <Link to="/support" className="hover:text-yellow-300 transition duration-200">Support</Link>
                    <Link
                        to="/login"
                        className="bg-yellow-400 text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-300 transition duration-300"
                    >
                        Login
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden focus:outline-none"
                >
                    {isOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-blue-700 space-y-2 py-3 px-6">
                    <Link to="/" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/history" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>History</Link>
                    <Link to="/about" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>About Us</Link>
                    <Link to="/support" className="block hover:text-yellow-300" onClick={() => setIsOpen(false)}>Support</Link>
                    <Link
                        to="/login"
                        className="block bg-yellow-400 text-blue-900 text-center font-semibold px-4 py-2 rounded-lg hover:bg-yellow-300 transition duration-300"
                        onClick={() => setIsOpen(false)}
                    >
                        Login
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
