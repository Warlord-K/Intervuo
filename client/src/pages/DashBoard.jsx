import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebaseConfig"; // Correctly import auth and db
import { useNavigate, Link } from "react-router-dom"; // Added Link
import { onAuthStateChanged } from "firebase/auth"; // Keep if needed, though useAuthState is often preferred
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, getDocs, orderBy } from "firebase/firestore";
import { Briefcase, Clock, Loader2 } from 'lucide-react'; // Use lucide-react icons
import { toast } from 'react-toastify'; // Use toast for notifications

// Helper to get Firebase ID token
const getIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User not authenticated.");
    throw new Error("User not authenticated.");
  }
  return await currentUser.getIdToken(true); // Force refresh if needed
};


function Dashboard() {
    const [usr, setUsr] = useState(null); // Store user object
    const [loading, setLoading] = useState(false); // Loading state for form submission
    const [err, setErr] = useState(null); // Error message state
    const [ok, setOk] = useState(false); // Success message state
    // Form data state (matches old structure)
    const [fData, setFData] = useState({
        co: "",
        role: "",
        lvl: "", // Default to empty, let select handle it
        iType: "behavioral", // Default to behavioral
        lang: "",
        notifyPref: "email", // Keep if needed, though not used in current flow
    });
    const [interviews, setInterviews] = useState([]); // State for interview history
    const [histLoading, setHistLoading] = useState(false); // Loading state for history
    const nav = useNavigate();

    // Effect to check auth state and fetch history
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUsr(u);
                // Fetch history using the correct logic for the current Firestore structure
                fetchHistory(u.uid);
            } else {
                // If user logs out, redirect to sign-in
                nav("/signin"); // Redirect to signin if not logged in
            }
        });
        // Cleanup subscription on unmount
        return () => unsub();
    }, [nav]); // Dependency on navigate

    // Fetch interview history from the correct subcollection
    const fetchHistory = async (uid) => {
        if (!uid) return;
        setHistLoading(true);
        setErr(null); // Clear previous errors
        try {
            // Query the user-specific subcollection 'interviewResults'
            // This assumes results are stored here after analysis
            const resultsColRef = collection(db, 'users', uid, 'interviewResults');
            // Order by creation date, newest first
            const q = query(resultsColRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const iList = querySnapshot.docs.map(d => ({
                id: d.id, // Firestore document ID of the result
                ...d.data() // Data stored in the result document
            }));

            // Additionally, fetch initiated interviews if needed (or combine logic)
            // For simplicity, we'll primarily rely on 'interviewResults' for history now.
            // If you also stored initial setup in 'interviews' subcollection, you might query that too.

            setInterviews(iList); // Update state with fetched results
        } catch (e) {
            console.error("Error fetching interview history:", e);
            setErr("Failed to load interview history.");
            toast.error("Failed to load interview history."); // Notify user
        } finally {
            setHistLoading(false);
        }
    };

    // Handle form input changes
    const handleChange = (e) => {
        setFData({ ...fData, [e.target.name]: e.target.value });
    };

    // Handle form submission to start an interview
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        // Basic validation
        if (!fData.co || !fData.role || !fData.lvl || !fData.iType) {
             toast.error('Please fill in Company, Role, Level, and Interview Type.');
             return;
        }

        setLoading(true); // Set loading state
        setErr(null); // Clear previous errors
        setOk(false); // Reset success state
        // Removed docRefId tracking as we navigate immediately if successful

        try {
            if (!usr) throw new Error("User not authenticated"); // Check if user is available

            // *** Get the Firebase Auth Token ***
            const token = await getIdToken();

            // Prepare data for the backend (matches backend expectation)
            const interviewDetailsForBackend = {
                co: fData.co,
                role: fData.role,
                lvl: fData.lvl,
                iType: fData.iType,
                lang: fData.lang || null, // Send null if empty
            };

            // Call backend to create Ultravox call
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5210'; // Use correct backend URL/port
            const response = await fetch(`${backendUrl}/api/start-interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // *** Include the Authorization Header ***
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(interviewDetailsForBackend) // Send data
            });

            // Check response status
            if (!response.ok) {
                 // Handle specific auth errors from backend
                 if (response.status === 401 || response.status === 403) {
                     const errorData = await response.json();
                     const errorMsg = `Authentication error: ${errorData.message || errorData.error}. Please log in again.`;
                     setErr(errorMsg);
                     toast.error(errorMsg);
                     // Optional: Redirect to login
                     // nav('/signin');
                     throw new Error(errorMsg);
                 }
                 // Handle other errors (like missing API key in profile)
                 const errorData = await response.json();
                 const errorMsg = `Error: ${errorData.error || errorData.message}`;
                 setErr(errorMsg);
                 toast.error(errorMsg);
                 throw new Error(errorMsg);
            }

            // Parse successful response
            const data = await response.json();

            // Check if joinUrl is received
            if (data.joinUrl) {
                setOk(true); // Set success state
                toast.success("Interview session created successfully!"); // Notify user

                // --- Optional: Save initial setup to Firestore ---
                // This helps track initiated interviews even if not completed.
                // We use a placeholder ID 'temp' for navigation if saving fails.
                let interviewDocId = 'temp-' + Date.now(); // Placeholder ID
                try {
                   const interviewsColRef = collection(db, 'users', usr.uid, 'interviews'); // Collection for setup info
                   const docRef = await addDoc(interviewsColRef, {
                      company: fData.co, // Use full names consistent with display
                      role: fData.role,
                      level: fData.lvl,
                      interviewType: fData.iType,
                      preferredLanguage: fData.lang || null,
                      ultravoxCallId: data.callId,
                      status: 'initiated', // Mark as initiated
                      createdAt: serverTimestamp()
                   });
                   interviewDocId = docRef.id; // Get the actual ID
                   console.log("Interview setup saved with ID:", interviewDocId);
                } catch (dbError) {
                   console.error("Error saving interview setup to Firestore:", dbError);
                   toast.warn("Could not save interview setup details.");
                   // Use the placeholder ID for navigation if saving fails
                }
                // --- End Optional Firestore Save ---

                // Navigate to the interview page with joinUrl and pass details/ID in state
                // Use the actual or placeholder Firestore doc ID as the interviewId in the URL
                nav(`/interviewPage/${interviewDocId}?joinUrl=${encodeURIComponent(data.joinUrl)}`, {
                  state: {
                     // Pass details needed by InterviewPage (matching its ref structure)
                     interviewDetails: {
                         company: fData.co, // Use full names
                         role: fData.role,
                         level: fData.lvl,
                         interviewType: fData.iType // Pass type if needed
                     },
                     interviewId: interviewDocId // Pass the Firestore ID (actual or placeholder)
                  }
                });

                // Reset form after successful navigation setup
                setFData({ co: "", role: "", lvl: "", iType: "behavioral", lang: "", notifyPref: "email" });
                // Optionally refresh history immediately, though it might not show the new one yet
                // fetchHistory(usr.uid);

            } else {
                throw new Error('Join URL not received from server.'); // Handle case where joinUrl is missing
            }

        } catch (e) {
            console.error("Error in handleSubmit:", e);
            // Error state (err) and toast are likely set within the try block's error handling
            if (!err) { // Set a generic error if none was set before
               const errorMsg = `Failed to start interview: ${e.message}`;
               setErr(errorMsg);
               toast.error(errorMsg);
            }
            // Removed Firestore status update to 'failed' here for simplicity,
            // backend errors are handled above.
        } finally {
            setLoading(false); // Ensure loading is turned off
        }
    };

    // Format Firestore timestamp for display
    const formatDate = (ts) => {
        if (!ts || !ts.toDate) return 'N/A';
        try {
            return ts.toDate().toLocaleString(); // Format date and time
        } catch (e) {
            console.error("Error formatting date:", e, ts);
            return "Invalid Date";
        }
    }

    // --- JSX Structure (Matches Old Version) ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                Welcome back, {usr?.displayName || usr?.email || "User"}!
                            </h1>
                            <p className="text-gray-600">
                                Ready for your next mock interview?
                            </p>
                        </div>
                        {/* Optional: Add Logout button or link to profile */}
                        {/* <button onClick={logOut} className="...">Logout</button> */}
                    </div>
                </div>

                {/* Notifications */}
                {ok && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow">
                        <p className="text-green-700 font-medium">Interview created successfully! Navigate to the Interview page when ready.</p>
                    </div>
                )}
                {err && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow">
                        <p className="text-red-700 font-medium">Error: {err}</p>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Interview Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Briefcase className="text-purple-600" size={24} />
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Schedule Interview</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Company & Role */}
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="co" className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                                    <input
                                        type="text"
                                        id="co" // Match label htmlFor
                                        name="co"
                                        value={fData.co}
                                        onChange={handleChange}
                                        placeholder="e.g., Google"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                    <input
                                        type="text"
                                        id="role" // Match label htmlFor
                                        name="role"
                                        value={fData.role}
                                        onChange={handleChange}
                                        placeholder="e.g., Software Engineer"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Level & Type */}
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="lvl" className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                                    <select
                                        id="lvl" // Match label htmlFor
                                        name="lvl"
                                        value={fData.lvl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white" // Added bg-white for consistency
                                        required
                                    >
                                        <option value="" disabled>Select Level</option> {/* Added disabled default */}
                                        <option value="Internship">Internship</option>
                                        <option value="Entry-Level">Entry-Level</option>
                                        <option value="Junior">Junior</option> {/* Added Junior */}
                                        <option value="Mid-Level">Mid-Level</option>
                                        <option value="Senior">Senior</option> {/* Changed from Senior-Level */}
                                        <option value="Staff">Staff</option> {/* Added Staff */}
                                        <option value="Principal">Principal</option> {/* Added Principal */}
                                        <option value="Manager">Manager</option> {/* Added Manager */}
                                        <option value="Director">Director</option> {/* Added Director */}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="iType" className="block text-sm font-medium text-gray-700 mb-1">Interview Type *</label>
                                    <select
                                        id="iType" // Match label htmlFor
                                        name="iType"
                                        value={fData.iType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white" // Added bg-white
                                        required
                                    >
                                        <option value="behavioral">Behavioral</option>
                                        <option value="technical">Technical (General)</option>
                                        <option value="coding">Coding Challenge</option>
                                        <option value="system-design">System Design</option>
                                    </select>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label htmlFor="lang" className="block text-sm font-medium text-gray-700 mb-1">Programming Language (Optional)</label>
                                <select
                                    id="lang" // Match label htmlFor
                                    name="lang"
                                    value={fData.lang}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white" // Added bg-white
                                >
                                    <option value="">Select Language (Optional)</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Python">Python</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="C#">C#</option>
                                    <option value="Go">Go</option>
                                    <option value="Ruby">Ruby</option>
                                    {/* Add other languages if needed */}
                                </select>
                            </div>

                            {/* Removed Notification Preference Section */}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow hover:shadow-md`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" /> {/* Using lucide spinner */}
                                        Creating Interview...
                                    </>
                                ) : "Schedule Interview"}
                            </button>
                        </form>
                    </div>

                    {/* Interview History */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="text-purple-600" size={24} />
                            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Interview History</h2>
                        </div>

                        {histLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="animate-spin h-8 w-8 text-purple-600" /> {/* Using lucide spinner */}
                            </div>
                        ) : interviews.length > 0 ? (
                            <div className="overflow-x-auto">
                                {/* Using a simpler list format instead of table for better responsiveness */}
                                <ul className="space-y-4">
                                    {interviews.map(i => (
                                        <li key={i.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                           <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                                <div className="mb-2 sm:mb-0">
                                                    <p className="font-semibold text-gray-900">{i.role || 'N/A Role'} at {i.company || i.co || 'N/A Company'}</p>
                                                    <p className="text-sm text-gray-500">{i.level || 'N/A Level'} - {i.interviewType || i.iType || 'N/A Type'}</p>
                                                </div>
                                                {/* Display status based on interviewResults data */}
                                                {/* Status logic might need adjustment based on exact data structure */}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    // Assuming 'scores' exist in completed results
                                                    i.scores ? 'bg-blue-100 text-blue-800' :
                                                    // If no scores, assume it might be just initiated or failed
                                                    i.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800' // Default/Unknown status
                                                }`}>
                                                    {i.scores ? 'Completed' : (i.status === 'failed' ? 'Failed' : 'Unknown')}
                                                </span>
                                           </div>
                                           <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
                                                <p className="text-gray-500 mb-2 sm:mb-0">
                                                    Date: {formatDate(i.createdAt)}
                                                </p>
                                                {/* Link to view results */}
                                                {i.scores && ( // Only show 'View Results' if analysis/scores exist
                                                    <Link
                                                        to={`/interview/${i.id}/results`} // Navigate to results page using the result ID
                                                        className="text-purple-600 hover:text-purple-800 font-medium"
                                                    >
                                                        View Results
                                                    </Link>
                                                )}
                                                {/* Removed Join Now button as history shows completed/failed interviews */}
                                           </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No completed interview results found.</p>
                                <p className="text-sm text-gray-400 mt-1">Schedule an interview to see your history here!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;