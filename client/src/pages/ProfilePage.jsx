import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaUserCircle, FaKey, FaExternalLinkAlt } from 'react-icons/fa';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ultravoxKey, setUltravoxKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showUltravoxKey, setShowUltravoxKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUltravoxKey(data.ultravoxApiKey || '');
            setGroqKey(data.groqApiKey || '');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error('Failed to load API keys.');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to save changes.');
      return;
    }
    setIsSaving(true);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userDocRef, {
        ultravoxApiKey: ultravoxKey,
        groqApiKey: groqKey,
        email: user.email
      }, { merge: true });
      toast.success('API Keys saved successfully!');
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error('Failed to save API keys.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-xl font-semibold text-gray-700">Loading your profile...</div>
    </div>;
  }

  if (!user) {
    return <div className="text-center mt-10 p-6 text-gray-700">Please log in to view and manage your profile.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-800">Your Profile</h1>
          <p className="text-slate-600 mt-2">Manage your account details and API keys.</p>
        </header>

        <div className="bg-white shadow-xl rounded-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <FaUserCircle className="w-20 h-20 text-sky-500" />
            <div className="text-center sm:text-left">
              <p className="text-xl font-semibold text-slate-700">Email Address</p>
              <p className="text-slate-600 text-lg">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-2 text-slate-700 flex items-center">
            <FaKey className="mr-3 text-sky-500" /> API Keys Configuration
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            To use Intervuo's full capabilities, you'll need to add your API keys from Ultravox and Groq.
            Follow the steps below to generate and save your keys.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">Ultravox API Key</h3>
              <p className="text-xs text-slate-500 mb-2">
                No key yet?
                <a
                  href="https://app.ultravox.ai/settings/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-semibold hover:underline ml-1 group inline-flex items-center"
                >
                  Create your Ultravox Key <FaExternalLinkAlt className="ml-1 w-3 h-3 group-hover:scale-110 transition-transform" />
                </a>
              </p>
              <div className="relative">
                <input
                  type={showUltravoxKey ? "text" : "password"}
                  id="ultravoxKey"
                  value={ultravoxKey}
                  onChange={(e) => setUltravoxKey(e.target.value)}
                  placeholder="Paste your Ultravox API Key here"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowUltravoxKey(!showUltravoxKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-slate-500 hover:text-slate-700"
                >
                  {showUltravoxKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">Groq API Key</h3>
              <p className="text-xs text-slate-500 mb-2">
                No key yet?
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-700 font-semibold hover:underline ml-1 group inline-flex items-center"
                >
                  Create your Groq Key <FaExternalLinkAlt className="ml-1 w-3 h-3 group-hover:scale-110 transition-transform" />
                </a>
              </p>
              <div className="relative">
                <input
                  type={showGroqKey ? "text" : "password"}
                  id="groqKey"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="Paste your Groq API Key here"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-slate-500 hover:text-slate-700"
                >
                  {showGroqKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white transition-all duration-150 ease-in-out
                ${isSaving ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 active:bg-sky-800'}
                disabled:opacity-70`}
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Keys...
                </div>
              ) : 'Save API Keys'}
            </button>
          </form>
        </div>
        <footer className="text-center mt-10 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Intervuo. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ProfilePage;
