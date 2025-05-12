import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UltravoxSession } from 'ultravox-client';
import { auth } from '../config/firebaseConfig';
import { Mic, MicOff, PhoneOff, Loader2, AlertTriangle, Info, MessageSquare, User, Bot } from 'lucide-react'; // Added icons

// Function to get ID token (no changes, kept for completeness)
const getIdToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User not authenticated.");
    throw new Error("User not authenticated.");
  }
  return await currentUser.getIdToken(true);
};


export default function InterviewPage() {
  // State variables (mostly unchanged, added a few for UI)
  const [sess, setSess] = useState(null);
  const [jUrl, setJUrl] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('disconnected'); // e.g., 'idle', 'listening', 'thinking', 'speaking'
  const [err, setErr] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Refs (unchanged)
  const loc = useLocation();
  const nav = useNavigate();
  const sessRef = useRef(null);
  const interviewDetailsRef = useRef(loc.state?.interviewDetails || null);
  const interviewIdRef = useRef(loc.state?.interviewId || null);
  const transcriptContainerRef = useRef(null); // For auto-scrolling

  // Effect for setting join URL and interview details from location state (unchanged)
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const url = params.get('joinUrl');
    if (url) {
      setJUrl(decodeURIComponent(url));
      if (!interviewDetailsRef.current && interviewIdRef.current) {
          // console.warn("Interview details not found in location state, but ID is present.");
      }
      if (!interviewIdRef.current && loc.state?.interviewId) {
          interviewIdRef.current = loc.state.interviewId;
          // console.log("Set interviewId from location state:", interviewIdRef.current);
      }
    } else {
      setErr("No join URL provided. Please check the link.");
    }
  }, [loc.search, loc.state]);

  // Effect for leaving call on component unmount (unchanged)
  useEffect(() => {
    const sessionInstance = sessRef.current;
    return () => {
      if (sessionInstance) {
        // console.log('Leaving call on unmount');
        try { sessionInstance.leaveCall(); } catch(e) { console.error("Error leaving call on unmount:", e); }
        sessRef.current = null;
      }
    };
  }, []);

  // Effect for auto-scrolling transcript (unchanged)
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTo({
          top: transcriptContainerRef.current.scrollHeight,
          behavior: 'smooth'
      });
    }
  }, [transcript]);

  // Function to join the interview
  const joinInterview = async () => {
    if (!jUrl || isJoining || isJoined) return;
    setIsJoining(true);
    setErr(null);
    setTranscript([]); // Clear previous transcript
    try {
      // console.log('Attempting to join with URL:', jUrl);
      const uvSess = new UltravoxSession();
      sessRef.current = uvSess;

      uvSess.addEventListener('status', (event) => {
        const newStatus = uvSess.status;
        // console.log('Session status changed: ', newStatus, 'Event:', event);
        const previousStatus = currentStatus; // Capture currentStatus before it's updated
        setCurrentStatus(newStatus); // Update status for UI

        switch (newStatus) {
          case 'connecting':
            setIsJoining(true);
            setIsJoined(false);
            setErr(null);
            break;
          case 'idle':
          case 'listening':
          case 'thinking':
          case 'speaking':
            setIsJoining(false);
            setIsJoined(true);
            setSess(uvSess); // Set session object once truly joined and active
            break;
          case 'disconnecting':
            // Handled by 'disconnected' or if user initiated
            break;
          case 'disconnected':
            setIsJoining(false);
            setIsJoined(false);
            if (sessRef.current && previousStatus !== 'connecting' && previousStatus !== 'disconnected') {
                // console.log("Disconnected unexpectedly after being joined, proceeding to analysis.");
                endInterview(true); // Auto-end and analyze if unexpectedly disconnected
            } else if (previousStatus === 'connecting') {
                // console.error("Connection attempt failed immediately.");
                setErr("Connection failed. Server might be unavailable, the link is invalid, or there are network issues. Please try again.");
                if (sessRef.current) { try { sessRef.current.leaveCall(); } catch (e) {/* ignore */} sessRef.current = null; }
                setSess(null);
            } else {
                // console.log("Status became disconnected, but likely due to manual end or previous state.");
            }
            break;
          default:
            // console.warn('Unhandled session status:', newStatus);
        }
      });

      uvSess.addEventListener('transcripts', (event) => {
          const newTranscripts = event.transcripts || uvSess.transcripts || [];
          // console.log('Raw Transcripts received: ', newTranscripts);
          // Filter out empty or placeholder transcripts if necessary
          const validTranscripts = newTranscripts.filter(t => t.text && t.text.trim() !== "");
          setTranscript([...validTranscripts]);
      });

      // console.log('Calling joinCall...');
      await uvSess.joinCall(jUrl);
      // console.log('joinCall promise resolved.');
      // Note: Status event 'idle' will confirm the join.
    } catch (error) {
      console.error('Error during joinCall or session setup:', error);
      setErr(`Failed to join the interview: ${error.message}. Please check the link and your connection.`);
      setIsJoining(false);
      setIsJoined(false);
      setCurrentStatus('disconnected');
      if(sessRef.current){ try { sessRef.current.leaveCall(); } catch (leaveError) {/* ignore */} sessRef.current = null; }
      setSess(null);
    }
  };

  // Function to end the interview and proceed to analysis
  const endInterview = async (navigateAfterAnalysis = true) => {
    if (isAnalyzing) return; // Prevent multiple calls
    // console.log('Ending interview. Analyzing...');
    setIsAnalyzing(true);
    setErr(null);

    const finalTranscript = transcript.filter(t => t.isFinal && t.text && t.text.trim() !== ""); // Ensure final and non-empty

    const sessionInstance = sessRef.current;
    if (sessionInstance) {
        try { sessionInstance.leaveCall(); } catch (e) { console.error("Error during leaveCall:", e); }
      sessRef.current = null;
    }
    setSess(null); // Clear session state
    setIsJoined(false);
    setIsJoining(false);
    setCurrentStatus('disconnected');
    // console.log('Interview ended locally. Proceeding with analysis.');

    const currentInterviewId = interviewIdRef.current;
    if (!currentInterviewId) {
        console.error("Interview ID is missing, cannot proceed to results.");
        setErr("Critical error: Interview ID is missing. Cannot save or view results.");
        setIsAnalyzing(false);
        // Optionally, navigate to an error page or dashboard with a message
        // nav("/error-page", { state: { message: "Missing interview ID." }});
        return;
    }

    if (finalTranscript.length > 0) {
        try {
            const token = await getIdToken(); // Get Firebase auth token
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5210'; // Ensure your backend URL is correct
            const response = await fetch(`${backendUrl}/api/analyze-transcript`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send token for backend auth
                },
                body: JSON.stringify({
                    transcript: finalTranscript,
                    interviewDetails: interviewDetailsRef.current, // Pass details if needed by backend
                    interviewId: currentInterviewId // Pass interviewId
                })
            });

            if (!response.ok) {
                // Handle specific auth errors or other errors from backend
                if (response.status === 401 || response.status === 403) {
                    setErr("Authentication error. Please ensure you are logged in.");
                }
                const errorData = await response.json().catch(() => ({ message: "Unknown analysis error" }));
                throw new Error(errorData.error || errorData.message || `Analysis request failed with status: ${response.status}`);
            }

            const analysisResult = await response.json();
            // console.log("Analysis received:", analysisResult);

            if (navigateAfterAnalysis) {
                nav(`/interview/${currentInterviewId}/results`, {
                    state: {
                        analysis: analysisResult,
                        transcript: finalTranscript,
                        interviewDetails: interviewDetailsRef.current
                    }
                });
            }

        } catch (analysisError) {
            console.error("Error during transcript analysis:", analysisError);
            setErr(`Failed to get interview analysis: ${analysisError.message}. You can still view the transcript if available.`);
            // Navigate to results page even on analysis error, showing the transcript and error
            if (navigateAfterAnalysis) {
                 nav(`/interview/${currentInterviewId}/results`, {
                    state: {
                        analysis: null, // Indicate analysis failed
                        transcript: finalTranscript,
                        interviewDetails: interviewDetailsRef.current,
                        error: `Analysis Error: ${analysisError.message}` // Pass error to results page
                    }
                 });
            }
        } finally {
            setIsAnalyzing(false);
        }
    } else {
        // console.log("No final transcript recorded, skipping analysis.");
        setIsAnalyzing(false);
        if (navigateAfterAnalysis) {
            // Navigate to dashboard or a page indicating no transcript was recorded
            nav('/dashboard', { state: { message: "No transcript was recorded for this interview." } });
        }
    }
  };

  // Helper to display current status
  const getDisplayStatus = () => {
    if (isAnalyzing) return { text: "Analyzing Your Interview...", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-blue-600" };
    if (isJoining) return { text: "Connecting to Interview...", icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-yellow-600" };
    if (isJoined) {
        let statusText = "Connected";
        if (currentStatus === 'listening') statusText = "Listening...";
        else if (currentStatus === 'speaking') statusText = "AI is Speaking...";
        else if (currentStatus === 'thinking') statusText = "AI is Thinking...";
        return { text: statusText, icon: <Mic className="w-4 h-4" />, color: "text-green-600" };
    }
    return { text: "Disconnected", icon: <MicOff className="w-4 h-4" />, color: "text-red-600" };
  };

  const displayStatus = getDisplayStatus();

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-sky-100 min-h-screen font-sans">
      <div className="bg-white shadow-2xl rounded-xl p-6 sm:p-8 w-full max-w-3xl transform transition-all duration-500 ease-in-out">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-sky-700 mb-2">AI Interview Session</h1>
          {interviewDetailsRef.current && (
            <p className="text-sm text-slate-600">
              Role: <span className="font-semibold">{interviewDetailsRef.current.role}</span> at <span className="font-semibold">{interviewDetailsRef.current.company}</span> ({interviewDetailsRef.current.level})
            </p>
          )}
        </div>

        {/* Status Display */}
        <div className={`flex items-center justify-center space-x-2 mb-6 p-3 rounded-lg text-sm font-medium ${displayStatus.color} bg-opacity-10 ${
            isJoined ? 'bg-green-50' : isJoining ? 'bg-yellow-50' : isAnalyzing ? 'bg-blue-50' : 'bg-red-50'
        }`}>
          {displayStatus.icon}
          <span>{displayStatus.text}</span>
        </div>

        {/* Error Display */}
        {err && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <p className="font-semibold">Error:</p>
            </div>
            <p className="text-sm ml-7">{err}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isJoined && !isAnalyzing && jUrl && (
          <div className="text-center mb-6">
            <p className="text-slate-600 mb-3">Ready to start your AI-powered interview?</p>
            <button
              onClick={joinInterview}
              disabled={isJoining || !jUrl || isJoined || isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-150 ease-in-out group"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (err ? 'Retry Join' : 'Join Interview')}
            </button>
          </div>
        )}

        {(isJoined || isAnalyzing) && (
          <div className="text-center mb-6">
            {isJoined && <p className="text-sm text-green-600 mb-3">You are currently in the interview.</p>}
            <button
              onClick={() => endInterview(true)}
              disabled={isAnalyzing || !isJoined}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-150 ease-in-out group"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <PhoneOff className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  End Interview & Get Analysis
                </>
              )}
            </button>
          </div>
        )}

        {/* Transcript Area */}
        <div className="bg-slate-50 p-4 rounded-lg shadow-inner min-h-[200px] sm:min-h-[300px] max-h-[40vh] sm:max-h-[50vh] overflow-y-auto scroll-smooth border border-slate-200" ref={transcriptContainerRef}>
          <h2 className="text-lg font-semibold text-slate-700 mb-3 sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-200">
            <MessageSquare className="w-5 h-5 inline-block mr-2 align-text-bottom" />
            Live Transcript
          </h2>
          <div className="space-y-3">
            {transcript.length > 0 ? (
              transcript.map((t, index) => (
                <div key={index} className={`flex items-start ${t.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
                        t.speaker === 'agent'
                        ? 'bg-sky-100 text-sky-800 rounded-br-none'
                        : 'bg-green-100 text-green-800 rounded-bl-none'
                    } ${!t.isFinal ? 'opacity-70 italic' : ''}`}
                    >
                        <span className="font-bold text-xs block mb-0.5">
                            {t.speaker === 'agent' ? <><Bot className="w-3.5 h-3.5 inline mr-1"/>Interviewer</> : <><User className="w-3.5 h-3.5 inline mr-1"/>You</>}
                        </span>
                        <p className="text-sm leading-relaxed">{t.text}{!t.isFinal && '...'}</p>
                    </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-10">
                <Info className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-sm text-center">
                  {isJoining ? "Connecting to the interview session..." : isJoined ? "Waiting for the conversation to begin..." : "Transcript will appear here once you join the interview."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}