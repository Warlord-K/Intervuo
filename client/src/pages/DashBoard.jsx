import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebaseConfig"; 
import { useNavigate, Link } from "react-router-dom"; 
import { onAuthStateChanged } from "firebase/auth"; 
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, getDocs, orderBy } from "firebase/firestore";
import { Briefcase, Clock, Loader2 } from 'lucide-react'; 
import { toast } from 'react-toastify'; 

const getIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User not authenticated.");
    throw new Error("User not authenticated.");
  }
  return await currentUser.getIdToken(true); 
};


function Dashboard() {
    const [usr, setUsr] = useState(null); 
    const [loading, setLoading] = useState(false); 
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(false);
    const [fData, setFData] = useState({
        co: "",
        role: "",
        lvl: "", 
        iType: "behavioral", 
        lang: "",
        notifyPref: "email", 
    });
    const [interviews, setInterviews] = useState([]); 
    const [histLoading, setHistLoading] = useState(false); 
    const nav = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUsr(u);
                fetchHistory(u.uid);
            } else {
                nav("/signin"); 
            }
        });
        return () => unsub();
    }, [nav]); 
    const fetchHistory = async (uid) => {
        if (!uid) return;
        setHistLoading(true);
        setErr(null); 
        try {
            const resultsColRef = collection(db, 'users', uid, 'interviewResults');
            const q = query(resultsColRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const iList = querySnapshot.docs.map(d => ({
                id: d.id, 
                ...d.data()
            }));

            setInterviews(iList); 
        } catch (e) {
            console.error("Error fetching interview history:", e);
            setErr("Failed to load interview history.");
            toast.error("Failed to load interview history."); 
        } finally {
            setHistLoading(false);
        }
    };
    const handleChange = (e) => {
        setFData({ ...fData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault(); 
        if (!fData.co || !fData.role || !fData.lvl || !fData.iType) {
             toast.error('Please fill in Company, Role, Level, and Interview Type.');
             return;
        }

        setLoading(true);
        setErr(null); 
        setOk(false); 

        try {
            if (!usr) throw new Error("User not authenticated"); 
            const token = await getIdToken();
            const interviewDetailsForBackend = {
                co: fData.co,
                role: fData.role,
                lvl: fData.lvl,
                iType: fData.iType,
                lang: fData.lang || null, 
            };
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5210'; // Use correct backend URL/port
            const response = await fetch(`${backendUrl}/api/start-interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(interviewDetailsForBackend) 
            });
            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                     const errorData = await response.json();
                     const errorMsg = `Authentication error: ${errorData.message || errorData.error}. Please log in again.`;
                     setErr(errorMsg);
                     toast.error(errorMsg);
                     throw new Error(errorMsg);
                 }
                 const errorData = await response.json();
                 const errorMsg = `Error: ${errorData.error || errorData.message}`;
                 setErr(errorMsg);
                 toast.error(errorMsg);
                 throw new Error(errorMsg);
            }
            const data = await response.json();
            if (data.joinUrl) {
                setOk(true);
                toast.success("Interview session created successfully!");
                let interviewDocId = 'temp-' + Date.now(); 
                try {
                   const interviewsColRef = collection(db, 'users', usr.uid, 'interviews'); 
                   const docRef = await addDoc(interviewsColRef, {
                      company: fData.co, 
                      role: fData.role,
                      level: fData.lvl,
                      interviewType: fData.iType,
                      preferredLanguage: fData.lang || null,
                      ultravoxCallId: data.callId,
                      status: 'initiated', 
                      createdAt: serverTimestamp()
                   });
                   interviewDocId = docRef.id; 
                   console.log("Interview setup saved with ID:", interviewDocId);
                } catch (dbError) {
                   console.error("Error saving interview setup to Firestore:", dbError);
                   toast.warn("Could not save interview setup details.");
                }
                nav(`/interviewPage/${interviewDocId}?joinUrl=${encodeURIComponent(data.joinUrl)}`, {
                  state: {
                     interviewDetails: {
                         company: fData.co,
                         role: fData.role,
                         level: fData.lvl,
                         interviewType: fData.iType
                     },
                     interviewId: interviewDocId
                  }
                });
                setFData({ co: "", role: "", lvl: "", iType: "behavioral", lang: "", notifyPref: "email" });

            } else {
                throw new Error('Join URL not received from server.'); 
            }

        } catch (e) {
            console.error("Error in handleSubmit:", e);
            if (!err) {
               const errorMsg = `Failed to start interview: ${e.message}`;
               setErr(errorMsg);
               toast.error(errorMsg);
            }
        } finally {
            setLoading(false); // Ensure loading is turned off
// 

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
                                        <option value="behavioral">Behavioral & Situational</option>
                                        <option value="technical">Technical (General)</option>
                                        <option value="system-design">System Design</option>
                                        <option value="case_study">Case Study & Problem Solving</option>
                                        <option value="role_specific">Knowledge & Skills</option>
                                        <option value="cultural_fit">Cultural Fit Assessment</option>
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