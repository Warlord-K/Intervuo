import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import firebaseConfig from "../config/firebaseConfig";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-200">
            <div className="bg-white p-8 rounded-lg shadow-md text-center w-80">
                <h2 className="text-2xl font-bold text-purple-700 pb-6">Register</h2>

                
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border border-gray-300 rounded-md text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border border-gray-300 rounded-md text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full p-2 border border-gray-300 rounded-md text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                    className="bg-purple-700 text-white w-full py-2 rounded-md text-lg mt-2 hover:bg-purple-800 transition"
                    onClick={handleRegister}
                >
                    Register
                </button>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <p className="mt-4 text-sm">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-purple-700 font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
