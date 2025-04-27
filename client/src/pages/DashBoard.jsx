import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, getDocs, orderBy } from "firebase/firestore";
import { Briefcase, Clock } from 'lucide-react';



function Dashboard() {
    const [usr, setUsr] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(false);
    const [fData, setFData] = useState({
        co: "",
        role: "",
        lvl: "",
        iType: "technical",
        lang: "",
        notifyPref: "email",
    });
    const [interviews, setInterviews] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const nav = useNavigate();

    // No longer need getApiKey on frontend

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUsr(u);
                fetchHistory(u.uid);
            } else {
                nav("/");
            }
        });
        return () => unsub();
    }, [nav]);

    const fetchHistory = async (uid) => {
        if (!uid) return;
        setHistLoading(true);
        try {
            const q = query(
                collection(db, "interviews"),
                where("userId", "==", uid),
                orderBy("createdAt", "desc")
            );
            const qSnap = await getDocs(q);
            const iList = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setInterviews(iList);
        } catch (e) {
            console.error("Error fetching history:", e);
            setErr("Failed to load interview history.");
        } finally {
            setHistLoading(false);
        }
    };


    const logOut = async () => {
        try {
            await auth.signOut();
            nav("/landingPage");
        } catch (e) {
            console.error("Error logging out:", e);
        }
    };

    const handleChange = (e) => {
        setFData({ ...fData, [e.target.name]: e.target.value });
    };

    // Removed createPrompt - now handled by backend
    // Removed createCall - now handled by backend

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErr(null);
        setOk(false);
        let docRefId = null; // Keep track of Firestore doc ID

        try {
            if (!usr) throw new Error("User not auth");

            // 1. Create initial Firestore document
            const iDataForFirestore = {
                company: fData.co,
                role: fData.role,
                level: fData.lvl,
                interviewType: fData.iType,
                preferredLanguage: fData.lang,
                notificationPreference: fData.notifyPref,
                userId: usr.uid,
                userEmail: usr.email,
                userName: usr.displayName || "Anon",
                status: "scheduling", // Initial status
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "interviews"), iDataForFirestore);
            docRefId = docRef.id; // Store the ID

            // 2. Call backend to create Ultravox call
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5210'; // Adjust as needed
            const backendRes = await fetch(`${backendUrl}/api/start-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ // Send only necessary data for call creation
                    co: fData.co,
                    role: fData.role,
                    lvl: fData.lvl,
                    iType: fData.iType,
                    lang: fData.lang,
                })
            });

            if (!backendRes.ok) {
                const errData = await backendRes.json();
                throw new Error(errData.error || `Backend error: ${backendRes.status}`);
            }

            const uvRes = await backendRes.json();

            if (!uvRes.callId || !uvRes.joinUrl) {
                throw new Error("Backend did not return call ID or join URL");
            }

            // 3. Update Firestore document with call details
            await updateDoc(doc(db, "interviews", docRef.id), {
                ultravoxCallId: uvRes.callId,
                joinUrl: uvRes.joinUrl,
                status: "ready",
                updatedAt: serverTimestamp()
            });

            setOk(true);
            setFData({ co: "", role: "", lvl: "", iType: "technical", lang: "", notifyPref: "email" });
            fetchHistory(usr.uid); // Refresh history

        } catch (e) {
            console.error("Error creating interview:", e);
            setErr(e.message);
            // Optional: Update Firestore status to 'failed' if doc was created
            if (docRefId) {
                try {
                    await updateDoc(doc(db, "interviews", docRefId), {
                        status: "failed",
                        error: e.message,
                        updatedAt: serverTimestamp()
                    });
                } catch (updateError) {
                    console.error("Failed to update interview status to failed:", updateError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (ts) => {
        if (!ts || !ts.toDate) return 'N/A';
        return ts.toDate().toLocaleString();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome back, {usr?.displayName || "Guest"}!
                            </h1>
                            <p className="text-gray-600">
                                Ready for your next mock interview? 
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {ok && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                        <p className="text-green-700 font-medium">Interview created successfully! Your AI interviewer is ready.</p>
                    </div>
                )}

                {err && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <p className="text-red-700 font-medium">Error: {err}</p>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Interview Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Briefcase className="text-purple-600" size={24} />
                            <h2 className="text-2xl font-semibold text-gray-900">Schedule Interview</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        name="co"
                                        value={fData.co}
                                        onChange={handleChange}
                                        placeholder="e.g., Google"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={fData.role}
                                        onChange={handleChange}
                                        placeholder="e.g., Software Engineer"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                    <select
                                        name="lvl"
                                        value={fData.lvl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="">Select Level</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Entry-Level">Entry-Level</option>
                                        <option value="Mid-Level">Mid-Level</option>
                                        <option value="Senior-Level">Senior-Level</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                                    <select
                                        name="iType"
                                        value={fData.iType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="behavioral">Behavioral</option>
                                        <option value="system-design">System Design</option>
                                        <option value="coding">Coding</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
                                <select
                                    name="lang"
                                    value={fData.lang}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select Language (Optional)</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Python">Python</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="C#">C#</option>
                                    <option value="Go">Go</option>
                                    <option value="Ruby">Ruby</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preference</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="notifyPref"
                                            value="email"
                                            checked={fData.notifyPref === "email"}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700">Email</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="notifyPref"
                                            value="sms"
                                            checked={fData.notifyPref === "sms"}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700">SMS</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full ${loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Interview...
                                    </>
                                ) : "Schedule Interview"}
                            </button>
                        </form>
                    </div>

                    {/* Interview History */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="text-purple-600" size={24} />
                            <h2 className="text-2xl font-semibold text-gray-900">Interview History</h2>
                        </div>

                        {histLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : interviews.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Company</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interviews.map(i => (
                                            <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">{i.company}</div>
                                                    <div className="text-sm text-gray-500">{formatDate(i.createdAt)}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-gray-900">{i.role}</div>
                                                    <div className="text-sm text-gray-500">{i.level}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${i.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                            i.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                i.status === 'scheduling' ? 'bg-yellow-100 text-yellow-800' :
                                                                    i.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {i.status.charAt(0).toUpperCase() + i.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {i.status === 'ready' && i.joinUrl && (
                                                        <button
                                                            onClick={() => nav(`/interviewPage?joinUrl=${encodeURIComponent(i.joinUrl)}`)}
                                                            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                                                        >
                                                            Join Now
                                                        </button>
                                                    )}
                                                    {i.status === 'completed' && (
                                                        <button className="text-gray-400 cursor-not-allowed font-medium text-sm">
                                                            Review
                                                        </button>
                                                    )}
                                                    {i.status === 'failed' && (
                                                        <span className="text-red-600 text-sm">Failed</span>
                                                    )}
                                                    {i.status === 'scheduling' && (
                                                        <span className="text-yellow-600 text-sm">Scheduling...</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No interviews scheduled yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Create your first interview to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
