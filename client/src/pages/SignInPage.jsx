import { Link, useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../config/firebaseConfig";
import { initializeApp } from "firebase/app";
import { useState } from "react";


const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });


const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

function SignInPage() {
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const signIn = async () => {
        setError(""); 
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard"); 
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                setError("Email not found. Please register.");
            } else if (error.code === "auth/wrong-password") {
                setError("Invalid email or password.");
            } else if (error.code === "auth/invalid-email") {
                setError("Please enter a valid email address.");
            } else {
                setError("Error signing in. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


    const register = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message);
        }
    };

    const signInWithGoogle = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, provider);
            console.log("User Info:", result.user);
            navigate("/dashboard"); 
        } catch (error) {
            console.error("Google Sign-In Error:", error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex justify-center items-center h-screen bg-gray-200">
            <div className="bg-white p-8 rounded-lg shadow-md text-center w-80">
                <h2 className="text-2xl font-bold text-purple-700">Sign In</h2>

              
                <button className="bg-purple-700 text-white w-full py-2 rounded-md text-lg mt-4 transition" onClick={signInWithGoogle}>
                    Sign In with Google
                </button>

                <div className="my-4 font-semibold text-gray-500">OR</div>

               
                <input
                    type="email"
                    placeholder="Email"
                    value={email}  
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"  // Added onChange
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full p-2 border border-gray-300 rounded-md text-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500" // Added onChange
                />

                <button className="bg-purple-700 text-white w-full py-2 rounded-md text-lg mt-2 hover:bg-purple-800 transition" onClick={signIn}>
                    Sign In
                </button>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <p className="mt-4 text-sm">
                    Don't have an account?
                    <Link to="/register" className="text-purple-700 font-bold hover:underline"> Create an Account</Link>
                </p>
            </div>
        </div>
    );
}

export default SignInPage;
