import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaUserCircle } from 'react-icons/fa';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ultravoxKey, setUltravoxKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch API keys from Firestore
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
      // Use setDoc with merge: true to update or create the document
      await setDoc(userDocRef, {
        ultravoxApiKey: ultravoxKey,
        groqApiKey: groqKey,
        email: user.email // Optionally store email or other non-sensitive info
      }, { merge: true }); // merge: true ensures we don't overwrite other fields

      toast.success('API Keys saved successfully!');
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error('Failed to save API keys.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="text-center mt-10">Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Profile</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 flex items-center space-x-4">
        <FaUserCircle className="w-16 h-16 text-gray-500" />
        <div>
          <p className="text-lg font-semibold text-gray-700">Email:</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">API Keys</h2>
        <p className="text-sm text-gray-500 mb-4">
          Provide your own API keys to use Intervuo. Get your keys from:
          <a href="https://app.ultravox.ai/settings/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">Ultravox</a> and
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">Groq</a>.
        </p>
        <form onSubmit={handleSaveChanges}>
          <div className="mb-4">
            <label htmlFor="ultravoxKey" className="block text-sm font-medium text-gray-700 mb-1">
              Ultravox API Key
            </label>
            <input
              type="password" // Use password type to obscure the key
              id="ultravoxKey"
              value={ultravoxKey}
              onChange={(e) => setUltravoxKey(e.target.value)}
              placeholder="Enter your Ultravox API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="groqKey" className="block text-sm font-medium text-gray-700 mb-1">
              Groq API Key
            </label>
            <input
              type="password" // Use password type to obscure the key
              id="groqKey"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="Enter your Groq API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
          >
            {isSaving ? 'Saving...' : 'Save API Keys'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;