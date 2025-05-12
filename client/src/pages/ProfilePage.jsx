import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { ShieldCheck, AlertTriangle, Info, Edit3, ExternalLink, Save, HelpCircle } from 'lucide-react'; // Assuming you use lucide-react

// Ensure firebaseConfig is imported correctly
import { db, auth } from '../config/firebaseConfig'; // Adjust path as needed

function ProfilePage() {
    const [user, setUser] = useState(null);
    const [ultravoxApiKey, setUltravoxApiKey] = useState('');
    const [groqApiKey, setGroqApiKey] = useState('');
    const [initialUltravoxKey, setInitialUltravoxKey] = useState('');
    const [initialGroqKey, setInitialGroqKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const keysAreSet = initialUltravoxKey && initialGroqKey;

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
            fetchUserData(currentUser.uid);
        } else {
            setLoading(false);
            // Handle case where user is not authenticated, though App.jsx should prevent this
        }
    }, []);

    const fetchUserData = async (uid) => {
        setLoading(true);
        try {
            const userDocRef = doc(db, 'users', uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUltravoxApiKey(data.ultravoxApiKey || '');
                setGroqApiKey(data.groqApiKey || '');
                setInitialUltravoxKey(data.ultravoxApiKey || '');
                setInitialGroqKey(data.groqApiKey || '');
            } else {
                setError('User data not found.');
                toast.error('User data not found.');
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
            setError('Failed to fetch user data.');
            toast.error('Failed to fetch user data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setSaving(true);
        setError('');

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                ultravoxApiKey: ultravoxApiKey,
                groqApiKey: groqApiKey,
            });
            setInitialUltravoxKey(ultravoxApiKey); // Update initial state after save
            setInitialGroqKey(groqApiKey);
            toast.success('API keys updated successfully!');
        } catch (err) {
            console.error("Error updating API keys:", err);
            setError('Failed to update API keys. Please try again.');
            toast.error('Failed to update API keys.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <p className="text-lg text-gray-600">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Your Profile</h1>
                <p className="text-slate-600 mt-1">Manage your account details and API keys.</p>
            </header>

            {/* User Email Section */}
            {user && (
                <section className="bg-white p-6 rounded-lg shadow-lg border border-slate-200">
                    <div className="flex items-center space-x-4">
                        <div className="bg-sky-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-700">Email Address</h2>
                            <p className="text-slate-600 text-lg">{user.email}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* API Keys Configuration Section */}
            <section className={`bg-white p-6 rounded-lg shadow-lg border ${!keysAreSet ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200'}`}>
                <div className="flex items-center space-x-3 mb-4">
                     <ShieldCheck className={`w-8 h-8 ${!keysAreSet ? 'text-sky-600' : 'text-slate-500'}`} />
                    <h2 className="text-2xl font-semibold text-slate-700">API Keys Configuration</h2>
                </div>

                {!keysAreSet && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md shadow">
                        <div className="flex items-start">
                            <Info className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-700">Important: Set Your API Keys</h3>
                                <p className="text-red-600 mt-1">
                                    Welcome to Intervuo! To unlock all features and start conducting interviews, please add your API keys from Ultravox and Groq below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {keysAreSet && (
                     <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                        <div className="flex">
                            <ShieldCheck className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                            <p className="text-green-700">Your API keys are configured. You're all set!</p>
                        </div>
                    </div>
                )}

                <p className="text-slate-600 mb-6">
                    To use Intervuo's full capabilities, you'll need to add your API keys from Ultravox and Groq.
                    Follow the steps below to generate and save your keys.
                </p>

                {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4 text-sm">{error}</p>}

                <div className="space-y-6">
                    {/* Ultravox API Key Input */}
                    <div>
                        <label htmlFor="ultravoxKey" className="block text-sm font-medium text-slate-700 mb-1">
                            Ultravox API Key
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                id="ultravoxKey"
                                name="ultravoxKey"
                                className="flex-grow p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="Enter your Ultravox API Key"
                                value={ultravoxApiKey}
                                onChange={(e) => setUltravoxApiKey(e.target.value)}
                            />
                             <a
                                href="YOUR_ULTRAVOX_KEY_GENERATION_LINK" // Replace with actual link
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 whitespace-nowrap"
                                title="Get your Ultravox API Key (opens in new tab)"
                            >
                                <ExternalLink className="w-3 h-3 mr-1.5" /> Get Key
                            </a>
                        </div>
                        {!initialUltravoxKey && (
                            <p className="mt-2 text-xs text-sky-600 flex items-center">
                                <HelpCircle className="w-3.5 h-3.5 mr-1" />
                                No key yet? Click 'Get Key' to create your Ultravox Key.
                            </p>
                        )}
                    </div>

                    {/* Groq API Key Input */}
                    <div>
                        <label htmlFor="groqKey" className="block text-sm font-medium text-slate-700 mb-1">
                            Groq API Key
                        </label>
                         <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                id="groqKey"
                                name="groqKey"
                                className="flex-grow p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="Enter your Groq API Key"
                                value={groqApiKey}
                                onChange={(e) => setGroqApiKey(e.target.value)}
                            />
                            <a
                                href="YOUR_GROQ_KEY_GENERATION_LINK" // Replace with actual link
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 whitespace-nowrap"
                                title="Get your Groq API Key (opens in new tab)"
                            >
                               <ExternalLink className="w-3 h-3 mr-1.5" /> Get Key
                            </a>
                        </div>
                        {!initialGroqKey && (
                             <p className="mt-2 text-xs text-sky-600 flex items-center">
                                <HelpCircle className="w-3.5 h-3.5 mr-1" />
                                No key yet? Click 'Get Key' to create your Groq Key.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={saving || (ultravoxApiKey === initialUltravoxKey && groqApiKey === initialGroqKey)}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <> <Save className="w-5 h-5 mr-2" /> Save Changes </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default ProfilePage;
