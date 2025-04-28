import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { FaTimesCircle, FaFileAlt, FaComments, FaStar } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners'; // Using a spinner

const InterviewResultsPage = () => {
  const location = useLocation();
  const { interviewId } = useParams(); // Get ID from URL parameter :interviewId
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialData = location.state;

  useEffect(() => {
    const fetchResultsFromFirestore = async (userId) => {
      setLoading(true);
      setError(null);
      console.log("Fetching from Firestore for ID:", interviewId);

      if (!interviewId) {
        setError('Missing interview ID in URL.');
        setLoading(false);
        return;
      }

      try {
        const resultDocRef = doc(db, 'users', userId, 'interviewResults', interviewId);
        const docSnap = await getDoc(resultDocRef);

        if (docSnap.exists()) {
          console.log("Fetched data from Firestore:", docSnap.data());
          setResults(docSnap.data()); // Set the fetched data
        } else {
          console.log("No such document found in Firestore for ID:", interviewId);
          setError('Could not find interview data in database.'); // More specific error
        }
      } catch (err) {
        console.error("Error fetching interview results from Firestore:", err);
        setError(`Error fetching results: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("Auth state confirmed (User ID):", user.uid);
        if (initialData && initialData.analysis && !initialData.error) {
          console.log("Using initial data from location state:", initialData);
          setResults({
              ...initialData.analysis, // Contains summary, analysis, scores
              transcript: initialData.transcript,
              company: initialData.interviewDetails?.company,
              role: initialData.interviewDetails?.role,
              level: initialData.interviewDetails?.level,
              interviewType: initialData.interviewDetails?.interviewType
          });
          setLoading(false);
        }
        else if (initialData && initialData.error) {
            console.log("Using error from location state:", initialData.error);
            setError(initialData.error);
            setResults({
                transcript: initialData.transcript,
                company: initialData.interviewDetails?.company,
                role: initialData.interviewDetails?.role,
                level: initialData.interviewDetails?.level,
                interviewType: initialData.interviewDetails?.interviewType
            });
            setLoading(false);
        }
        else {
          fetchResultsFromFirestore(user.uid);
        }
      } else {
        console.log("Auth state changed to logged out while on results page.");
        setError("User is not logged in.");
        setLoading(false);
        setResults(null); // Clear any previous results
      }
    });
    return () => unsubscribe();

  }, [interviewId, initialData]); // Rerun effect if interviewId or initialData changes
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-100"> {/* Adjusted height */}
        <div className="text-center">
           <ClipLoader size={50} color={"#4f46e5"} loading={loading} />
           <p className="text-lg font-medium text-gray-700 mt-4">Loading Results...</p>
        </div>
      </div>
    );
  }
  if (error || (!loading && !results)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-100 px-4"> {/* Adjusted height and added padding */}
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full"> {/* Added w-full */}
          <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Results</h1>
          <p className="text-gray-600 mb-6">{error || 'Could not find interview data. Please go back to the dashboard.'}</p>
          <Link
            to="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md transition duration-300 inline-block" // Added inline-block
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  const renderStars = (score) => {
    if (score === null || score === undefined || score === 'N/A') return <span className="text-gray-400 italic">N/A</span>;
    const numericScore = Number(score);
    if (isNaN(numericScore)) return <span className="text-gray-400 italic">Invalid</span>;

    const filledStars = Math.round(numericScore / 2); // Assuming score is out of 10
    const emptyStars = Math.max(0, 5 - filledStars); // Ensure emptyStars isn't negative
    return (
        <div className="flex items-center"> {/* Added items-center */}
            {[...Array(filledStars)].map((_, i) => <FaStar key={`filled-${i}`} className="text-yellow-400" />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} className="text-gray-300" />)}
            <span className="ml-2 text-sm font-medium text-gray-700">({numericScore}/10)</span>
        </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Interview Results</h1>

      {/* Interview Context - Reads directly from results object */}
      <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
          <h2 className="text-lg font-semibold text-indigo-800 mb-2">Interview Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p><span className="font-medium">Company:</span> {results.company || 'N/A'}</p>
              <p><span className="font-medium">Role:</span> {results.role || 'N/A'}</p>
              <p><span className="font-medium">Level:</span> {results.level || 'N/A'}</p>
              <p><span className="font-medium">Type:</span> {results.interviewType || 'N/A'}</p>
          </div>
      </div>

       {/* Summary */}
       <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
                <FaFileAlt className="mr-2 text-blue-500" /> Summary
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{results.summary || 'No summary available.'}</p> {/* Added whitespace-pre-wrap */}
       </div>

       {/* Analysis */}
       {results.analysis && (
           <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <FaComments className="mr-2 text-green-500" /> Performance Analysis
                </h2>
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Strengths:</h3>
                    {results.analysis.strengths && results.analysis.strengths.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {results.analysis.strengths.map((strength, index) => <li key={`strength-${index}`}>{strength}</li>)}
                        </ul>
                    ) : <p className="text-gray-500 italic">No specific strengths identified.</p>}
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Areas for Improvement:</h3>
                    {results.analysis.areas_for_improvement && results.analysis.areas_for_improvement.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {results.analysis.areas_for_improvement.map((area, index) => <li key={`area-${index}`}>{area}</li>)}
                        </ul>
                    ) : <p className="text-gray-500 italic">No specific areas for improvement identified.</p>}
                </div>
           </div>
       )}

       {/* Scores */}
       {results.scores && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <FaStar className="mr-2 text-yellow-500" /> Score Breakdown
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(results.scores).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2">
                            <span className="text-gray-700 capitalize mb-1 sm:mb-0">{key.replace(/_/g, ' ')}:</span> {/* Replaced underscore */}
                            {renderStars(value)}
                        </div>
                    ))}
                </div>
            </div>
       )}


      {/* Optional: Display Transcript if available in results */}
      {results.transcript && Array.isArray(results.transcript) && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Full Transcript</h2>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto text-sm space-y-2">
            {results.transcript.map((t, index) => (
              <p key={index}>
                <span className={`font-semibold ${t.speaker === 'agent' ? 'text-purple-700' : 'text-blue-700'}`}>
                  {t.speaker === 'agent' ? 'Interviewer' : 'You'}:
                </span>{' '}
                {t.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Back to Dashboard Button */}
      <div className="text-center mt-8">
        <Link
          to="/dashboard"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md transition duration-300 inline-block" // Added inline-block
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default InterviewResultsPage;