import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { auth, db } from "./config/firebaseConfig";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/DashBoard";
import SignInPage from "./pages/SignInPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./pages/Layout";
import InterviewPage from "./pages/InterviewPage";
import InterviewResultsPage from "./pages/InterviewResultsPage";
import ProfilePage from "./pages/ProfilePage";
import { Link } from "react-router-dom"; // For NotFoundPage

const AppLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileKeysStatus, setProfileKeysStatus] = useState({ loading: true, keysSet: false });
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setProfileKeysStatus({ loading: true, keysSet: false });
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.ultravoxApiKey && data.groqApiKey) {
              setProfileKeysStatus({ loading: false, keysSet: true });
            } else {
              setProfileKeysStatus({ loading: false, keysSet: false });
            }
          } else {
            setProfileKeysStatus({ loading: false, keysSet: false });
          }
        } catch (error) {
          console.error("Error fetching user data for key check:", error);
          setProfileKeysStatus({ loading: false, keysSet: false });
        }
      } else {
        setCurrentUser(null);
        setProfileKeysStatus({ loading: true, keysSet: false });
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading || (currentUser && profileKeysStatus.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading Application...</p>
      </div>
    );
  }

  if (currentUser && !profileKeysStatus.keysSet && location.pathname !== '/profile' && location.pathname !== '/signin' && location.pathname !== '/register') {
    return <Navigate to="/profile" replace />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="/landingPage" element={<Navigate to="/" replace />} />
          <Route
            path="/dashboard"
            element={currentUser ? <Dashboard /> : <Navigate to="/signin" replace state={{ from: '/dashboard' }} />}
          />
          <Route
            path="/interviewPage/:interviewId"
            element={currentUser ? <InterviewPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />}
          />
          <Route
            path="/interview/:interviewId/results"
            element={currentUser ? <InterviewResultsPage /> : <Navigate to="/signin" replace state={{ from: location.pathname }} />}
          />
          <Route
            path="/profile"
            element={currentUser ? <ProfilePage /> : <Navigate to="/signin" replace state={{ from: '/profile' }} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="/signin"
          element={!currentUser ? <SignInPage /> : <Navigate to={profileKeysStatus.loading ? "/" : (profileKeysStatus.keysSet ? "/dashboard" : "/profile")} replace />}
        />
        <Route
          path="/register"
          element={!currentUser ? <RegisterPage /> : <Navigate to="/profile" replace />}
        />
      </Routes>
    </>
  );
}

function NotFoundPage() {
    return (
        <div className="text-center py-10 px-4 min-h-screen flex flex-col justify-center items-center bg-gray-100">
            <h1 className="text-4xl font-bold text-slate-800">404</h1>
            <p className="mt-3 text-xl text-slate-600">Oops! Page Not Found.</p>
            <p className="mt-2 text-md text-slate-500">Sorry, the page you are looking for does not exist or has been moved.</p>
            <Link to={auth.currentUser ? ( (profileKeysStatus.loading || !profileKeysStatus.keysSet) ? "/profile" : "/dashboard") : "/"} className="mt-6 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors duration-150">
              Return Home
            </Link>
        </div>
    );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
