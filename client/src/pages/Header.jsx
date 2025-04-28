import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../config/firebaseConfig';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Brain, Home, CreditCard, User, LogOut, Menu, X } from 'lucide-react';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const nav = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsub();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            nav('/signin');         
        } catch (err) {
            console.error("Logout error:", err);
        }
    };


    const isActive = (path) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link
                            to="/"
                            className="flex items-center gap-2 group"
                        >
                            <Brain className="h-8 w-8 text-purple-600 group-hover:text-purple-700 transition-colors" />
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                Intervuo
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        <Link
                            to="/"
                            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/')
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Home
                        </Link>

                        {isLoggedIn ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/dashboard')
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                >
                                    <Brain className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>

                                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                                <Link
                                    to="/profile"
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/profile')
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-4 py-2 ml-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/signin"
                                className="flex items-center px-6 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Login
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="px-4 py-3 space-y-1 bg-white border-t border-gray-200">
                        <Link
                            to="/"
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/')
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Home className="h-5 w-5 mr-3" />
                            Home
                        </Link>

                        <Link
                            to="/pricing"
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/pricing')
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <CreditCard className="h-5 w-5 mr-3" />
                            Pricing
                        </Link>

                        {isLoggedIn ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Brain className="h-5 w-5 mr-3" />
                                    Dashboard
                                </Link>

                                <Link
                                    to="/profile"
                                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/profile')
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <User className="h-5 w-5 mr-3" />
                                    Profile
                                </Link>

                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all"
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/signin"
                                className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <User className="h-5 w-5 mr-3" />
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;