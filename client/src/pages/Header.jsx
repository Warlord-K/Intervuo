import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FaUserCircle } from 'react-icons/fa';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Intervuo</Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none"
              >
                <FaUserCircle className="w-8 h-8 text-gray-400 hover:text-white" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg py-1 z-20">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/signin" className="hover:text-gray-300">Sign In</Link>
              <Link to="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;