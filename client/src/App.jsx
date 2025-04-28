import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from "react-router-dom"; // Added Outlet
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ToastContainer } from 'react-toastify'; // Added ToastContainer
import 'react-toastify/dist/ReactToastify.css';

// Import config and pages
import firebaseConfig from "./config/firebaseConfig"; // Keep this import
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashBoard";
import SignInPage from "./pages/SignInPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./pages/Layout"; // Keep Layout import
import InterviewPage from "./pages/InterviewPage";
import InterviewResultsPage from "./pages/InterviewResultsPage";
import ProfilePage from "./pages/ProfilePage";
// Removed PricingPage and PaymentSuccess imports

// --- Firebase Initialization (Original Logic) ---
// Note: It's generally safer to initialize Firebase once, ideally outside the component,
// but we'll keep your original logic structure here.
let firebaseApp;
try {
    // Attempt to get the default app instance if it already exists
    const authInstance = getAuth(); // Get default auth instance
    firebaseApp = authInstance.app;
} catch (e) {
    // If getting default fails (likely because no app exists), initialize it
    try {
       firebaseApp = initializeApp(firebaseConfig);
       console.log("Firebase initialized in App.jsx catch block.");
    } catch (initError){
       console.error("Firebase initialization error in App.jsx:", initError);
       // Handle initialization failure (e.g., show an error message)
       // For now, we'll let it proceed, but auth might fail.
    }
}
// Ensure auth is obtained from the potentially newly initialized app
const auth = getAuth(firebaseApp);
// --- End Firebase Initialization ---


// --- Layout Wrapper Component ---
// This component uses the Layout and renders nested routes via <Outlet />
const AppLayout = () => (
  <Layout>
    <Outlet /> {/* This renders the matched child route component */}
  </Layout>
);

// --- Main App Component ---
function App() {
  const [authStatus, setAuthStatus] = useState(null); // null = loading, true = logged in, false = logged out

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `Logged in (${user.uid})` : "Logged out");
      setAuthStatus(user ? true : false); // Update state based on user presence
    });
    // Cleanup function to unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Loading state while checking authentication
  if (authStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {/* You can replace this with a more sophisticated loading spinner */}
        <p className="text-gray-600 text-lg">Loading Authentication...</p>
      </div>
    );
  }

  // --- Router and Routes ---
  return (
    <Router>
      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        {/* Routes using the Layout (Public and Private) */}
        <Route element={<AppLayout />}> {/* Use the wrapper component */}
          {/* Public Routes */}
          <Route index element={<LandingPage />} /> {/* Default route */}
          <Route path="/landingPage" element={<Navigate to="/" replace />} /> {/* Redirect */}

          {/* Private Routes (Conditional Rendering) */}
          <Route
            path="/dashboard"
            element={authStatus ? <Dashboard /> : <Navigate to="/signin" replace state={{ from: '/dashboard' }} />}
          />
          {/* Updated InterviewPage route with dynamic segment */}
          <Route
            path="/interviewPage/:interviewId" // Use dynamic segment for ID
            element={authStatus ? <InterviewPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />} // Pass current path
          />
          {/* Updated InterviewResultsPage route */}
           <Route
            path="/interview/:interviewId/results" // Match the path used in InterviewPage navigation
            element={authStatus ? <InterviewResultsPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />}
          />
          <Route
            path="/profile"
            element={authStatus ? <ProfilePage /> : <Navigate to="/signin" replace state={{ from: '/profile' }} />}
          />

           {/* Removed Pricing and Payment Success Routes */}
           {/* <Route path="/pricing" element={<PricingPage />} /> */}
           {/* <Route path="/paymentSuccess" element={<PaymentSuccess/>} /> */}

          {/* Catch-all 404 Route within the layout */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Routes without the main Layout (Login/Register) */}
        <Route
          path="/signin"
          // Redirect to dashboard if already logged in, otherwise show SignInPage
          element={!authStatus ? <SignInPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          // Redirect to dashboard if already logged in, otherwise show RegisterPage
          element={!authStatus ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
        />

      </Routes>
    </Router>
  );
}

// --- NotFoundPage Component (Included for completeness) ---
function NotFoundPage() {
    return (
        <div className="text-center py-10 px-4">
            <h1 className="text-3xl font-bold text-gray-800">404 - Not Found</h1>
            <p className="mt-2 text-gray-600">Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
              Return Home
            </Link>
        </div>
    );
}

export default App;