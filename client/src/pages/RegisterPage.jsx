import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig"; // Assuming db is exported from firebaseConfig

function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password should be at least 6 characters.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                ultravoxApiKey: "",
                groqApiKey: "",
                createdAt: new Date().toISOString(),
            });
            
            navigate("/profile");
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please sign in.");
            } else if (error.code === 'auth/weak-password') {
                setError("Password is too weak. Please choose a stronger password.");
            } else if (error.code === 'auth/invalid-email') {
                setError("Please enter a valid email address.");
            }
            else {
                setError("Failed to create an account. Please try again.");
                console.error("Registration error:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center w-full max-w-md">
                <h2 className="text-3xl font-bold text-sky-700 mb-8">Create Your Account</h2>
                <form onSubmit={handleRegister}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (min. 6 characters)"
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    {error && <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded-md">{error}</p>}

                    <button
                        type="submit"
                        className={`w-full py-3 rounded-lg text-lg font-semibold text-white transition-all duration-150 ease-in-out
                            ${loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 active:bg-sky-800'}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Registering...
                            </div>
                        ) : 'Register'}
                    </button>
                </form>
                <p className="mt-6 text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-sky-600 font-semibold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
