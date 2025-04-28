import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

import firebaseConfig from "./config/firebaseConfig"; 
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashBoard";
import SignInPage from "./pages/SignInPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./pages/Layout"; 
import InterviewPage from "./pages/InterviewPage";
import InterviewResultsPage from "./pages/InterviewResultsPage";
import ProfilePage from "./pages/ProfilePage";

let firebaseApp;
try {
    const authInstance = getAuth(); 
    firebaseApp = authInstance.app;
} catch (e) {
    try {
       firebaseApp = initializeApp(firebaseConfig);
       console.log("Firebase initialized in App.jsx catch block.");
    } catch (initError){
       console.error("Firebase initialization error in App.jsx:", initError);
    }
}
const auth = getAuth(firebaseApp);
const AppLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  const [authStatus, setAuthStatus] = useState(null); 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `Logged in (${user.uid})` : "Logged out");
      setAuthStatus(user ? true : false); 
    });
    return () => unsubscribe();
  }, []);
  if (authStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading Authentication...</p>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route element={<AppLayout />}> 
          <Route index element={<LandingPage />} /> 
          <Route path="/landingPage" element={<Navigate to="/" replace />} /> 
          <Route
            path="/dashboard"
            element={authStatus ? <Dashboard /> : <Navigate to="/signin" replace state={{ from: '/dashboard' }} />}
          />
          <Route
            path="/interviewPage/:interviewId" 
            element={authStatus ? <InterviewPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />}
          />
           <Route
            path="/interview/:interviewId/results" 
            element={authStatus ? <InterviewResultsPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />}
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
            <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
              Return Home
            </Link>
        </div>
    );
}

export default App;