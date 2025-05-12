import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../config/firebaseConfig"; // Assuming db is exported
import { doc, getDoc, setDoc } from "firebase/firestore"; // For Google Sign-In user doc creation

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/dashboard";

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate(from, { replace: true });
        } catch (error) {
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                setError("Invalid email or password.");
            } else if (error.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError("Error signing in. Please try again.");
                console.error("Sign in error:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        if (loading) return;
        setLoading(true);
        setError("");

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    ultravoxApiKey: "",
                    groqApiKey: "",
                    createdAt: new Date().toISOString(),
                });
            }
            navigate(from, { replace: true });
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                setError("Google Sign-In cancelled.");
            } else {
                setError("Error signing in with Google. Please try again.");
                console.error("Google Sign-In Error:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center w-full max-w-md">
                <h2 className="text-3xl font-bold text-sky-700 mb-8">Welcome Back!</h2>
                
                <button 
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className={`w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg text-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors duration-150 mb-6 shadow-sm
                                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                    Sign In with Google
                </button>

                <div className="my-6 flex items-center">
                    <hr className="flex-grow border-t border-slate-300"/>
                    <span className="mx-4 text-slate-500 font-medium text-sm">OR</span>
                    <hr className="flex-grow border-t border-slate-300"/>
                </div>

                <form onSubmit={handleSignIn}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
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
                                Signing In...
                            </div>
                        ) : 'Sign In'}
                    </button>
                </form>
                <p className="mt-6 text-sm text-slate-600">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-sky-600 font-semibold hover:underline">
                        Create an Account
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default SignInPage;
