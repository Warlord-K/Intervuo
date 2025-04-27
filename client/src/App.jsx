import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import firebaseConfig from "./config/firebaseConfig";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashBoard";
import SignInPage from "./pages/SignInPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./pages/Layout";
import InterviewPage from "./pages/InterviewPage";
import InterviewResultsPage from "./pages/InterviewResultsPage"; 
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import PaymentSuccess from "./pages/PaymentSuccess.jsx"


let firebaseApp;
try {
    const apps = getAuth().app?.options ? [getAuth().app] : [];
    if (apps.length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = apps[0];
    }
} catch (e) {
    try {
       firebaseApp = initializeApp(firebaseConfig);
    } catch (initError){
       console.error("Firebase initialization error:", initError);
    }
}
const auth = getAuth(firebaseApp);

function App() {
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthStatus(user ? true : false);
    });
    return () => unsub();
  }, []);

  if (authStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="/landingPage" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/paymentSuccess" element={<PaymentSuccess/>} />


          <Route
            path="/dashboard"
            element={authStatus ? <Dashboard /> : <Navigate to="/signin" replace state={{ from: '/dashboard' }} />}
          />
          <Route
            path="/interviewPage" 
            element={authStatus ? <InterviewPage /> : <Navigate to="/signin" replace state={{ from: '/interviewPage' }} />}
          />
           <Route
            path="/interview-results" // Add route for results page
            element={authStatus ? <InterviewResultsPage /> : <Navigate to="/signin" replace state={{ from: '/interview-results' }} />}
          />
          <Route
            path="/profile"
            element={authStatus ? <ProfilePage /> : <Navigate to="/signin" replace state={{ from: '/profile' }} />}
          />

           <Route path="*" element={<NotFoundPage />} />
        </Route>


        <Route
          path="/signin"
          element={!authStatus ? <SignInPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/register"
          element={!authStatus ? <RegisterPage /> : <Navigate to="/dashboard" replace />}
        />

      </Routes>
    </Router>
  );
}


function NotFoundPage() {
    return (
        <div className="text-center py-10 px-4">
            <h1 className="text-3xl font-bold text-gray-800">404 - Not Found</h1>
            <p className="mt-2 text-gray-600">Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="text-purple-600 hover:underline mt-4 inline-block">
              Return Home
            </Link>
        </div>
    );
}

export default App;
