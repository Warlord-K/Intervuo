/* crackItAI/client/src/pages/InterviewPage.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UltravoxSession } from 'ultravox-client';

export default function InterviewPage() {
  const [sess, setSess] = useState(null);
  const [jUrl, setJUrl] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('disconnected');
  const [err, setErr] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // State for analysis loading
  const loc = useLocation();
  const nav = useNavigate();
  const sessRef = useRef(null);
  const interviewDetailsRef = useRef(loc.state?.interviewDetails || null); // Store details from navigation state
  const interviewIdRef = useRef(loc.state?.interviewId || null); // Store ID from navigation state


  // --- Existing useEffect hooks ---
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const url = params.get('joinUrl');
    if (url) {
      setJUrl(decodeURIComponent(url));
      // If details weren't passed via state, maybe fetch them using ID if available
      if (!interviewDetailsRef.current && interviewIdRef.current) {
          // TODO: Add logic to fetch interview details from Firestore if needed
          console.warn("Interview details not found in location state.");
      }
    } else {
      setErr("No join URL provided.");
    }
  }, [loc.search]);

  useEffect(() => {
    const sessionInstance = sessRef.current;
    return () => {
      if (sessionInstance) {
        console.log('Leaving call on unmount');
        try {
          sessionInstance.leaveCall();
        } catch(e) {
          console.error("Error leaving call on unmount:", e);
        }
        sessRef.current = null;
      }
    };
  }, []);

  const joinInterview = async () => {
    if (!jUrl || isJoining || isJoined) {
      console.log('Join condition not met:', { jUrl, isJoining, isJoined });
      return;
    }

    setIsJoining(true);
    setErr(null);
    setTranscript([]);

    try {
      console.log('Attempting to join with URL:', jUrl);
      const uvSess = new UltravoxSession();
      sessRef.current = uvSess;

      uvSess.addEventListener('status', (event) => {
        const newStatus = uvSess.status;
        console.log('Session status changed: ', newStatus, 'Event:', event);
        const previousStatus = currentStatus;
        setCurrentStatus(newStatus);

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
            setSess(uvSess);
            break;
          case 'disconnecting':
            break;
          case 'disconnected':
            setIsJoining(false);
            setIsJoined(false);
            if (sessRef.current && previousStatus !== 'connecting' && previousStatus !== 'disconnected') {
                console.log("Disconnected unexpectedly after being joined, proceeding to analysis.");
                endInterview(true); 
            } else if (previousStatus === 'connecting') {
                 console.error("Connection attempt failed immediately.");
                 setErr("Connection failed. Server unavailable, invalid link, or network issues.");
                 if (sessRef.current) {
                     try { sessRef.current.leaveCall(); } catch (e) {}
                     sessRef.current = null;
                 }
                 setSess(null);
            } else {
                 console.log("Status became disconnected, but likely due to manual end or previous state.");
            }
            break;
          default:
            console.warn('Unhandled session status:', newStatus);
        }
      });

      uvSess.addEventListener('transcripts', (event) => {
         const newTranscripts = event.transcripts || uvSess.transcripts || [];
         console.log('Transcripts updated: ', newTranscripts);
         setTranscript(newTranscripts.filter(t => t.isFinal));
      });

      console.log('Calling joinCall...');
      await uvSess.joinCall(jUrl);
      console.log('joinCall promise resolved. Session status should update.');

    } catch (error) {
      console.error('Error during joinCall or session setup:', error);
      setErr(`Failed to join: ${error.message}`);
      setIsJoining(false);
      setIsJoined(false);
      setCurrentStatus('disconnected');
      if(sessRef.current){
         try { sessRef.current.leaveCall(); } catch (leaveError) {}
         sessRef.current = null;
      }
      setSess(null);
    }
  };

  const endInterview = async (navigateAfterAnalysis = true) => {
    if (isAnalyzing) return;

    console.log('Ending interview. Analyzing...');
    setIsAnalyzing(true);
    setErr(null);

    const sessionInstance = sessRef.current;
    const finalTranscript = [...transcript];
    if (sessionInstance) {
       try {
          sessionInstance.leaveCall();
       } catch (e) {
          console.error("Error during leaveCall:", e);
       }
      sessRef.current = null; 
    }
    setSess(null);
    setIsJoined(false);
    setIsJoining(false);
    setCurrentStatus('disconnected');
    console.log('Interview ended locally. Proceeding with analysis.');

    if (finalTranscript.length > 0) {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5210';
            const response = await fetch(`${backendUrl}/api/analyze-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: finalTranscript,
                    interviewDetails: interviewDetailsRef.current, // Send details for context
                    interviewId: interviewIdRef.current // Send ID if available for saving results
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Analysis failed: ${response.status}`);
            }

            const analysisResult = await response.json();
            console.log("Analysis received:", analysisResult);

            if (navigateAfterAnalysis) {
                nav('/interview-results', {
                    state: {
                        analysis: analysisResult,
                        transcript: finalTranscript,
                        interviewDetails: interviewDetailsRef.current
                    }
                });
            }

        } catch (analysisError) {
            console.error("Error during transcript analysis:", analysisError);
            setErr(`Failed to get interview analysis: ${analysisError.message}. You can still view the transcript.`);
            if (navigateAfterAnalysis) {
                 nav('/interview-results', {
                    state: {
                        analysis: null, 
                        transcript: finalTranscript,
                        interviewDetails: interviewDetailsRef.current,
                        error: `Analysis Error: ${analysisError.message}`
                    }
                 });
            }
        } finally {
            setIsAnalyzing(false);
        }
    } else {
        console.log("No transcript recorded, skipping analysis.");
        setIsAnalyzing(false);
        if (navigateAfterAnalysis) {
            nav('/dashboard'); 
        }
    }
  };


  const getDisplayStatus = () => {
    if (isAnalyzing) return "Analyzing...";
    if (isJoining) return "Connecting...";
    if (isJoined) return `Connected (${currentStatus})`;
    return "Disconnected";
  }

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl">
        <h1 className="text-xl sm:text-2xl font-semibold text-center mb-4">AI Interview Session</h1>
         {interviewDetailsRef.current && (
            <p className="text-center text-sm text-gray-500 mb-1">
                {interviewDetailsRef.current.role} at {interviewDetailsRef.current.company} ({interviewDetailsRef.current.level})
            </p>
         )}
        <p className="text-center text-xs text-gray-500 mb-3">Status: {getDisplayStatus()}</p>

        {err && (
           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
             <p>Error: {err}</p>
           </div>
        )}

        {!isJoined && !isAnalyzing && jUrl && ( // Don't show join if analyzing
          <div className="text-center mb-4">
             <p className="text-sm text-gray-600 mb-2">Ready to join the interview?</p>
             <button
               onClick={joinInterview}
               disabled={isJoining || !jUrl || isJoined || isAnalyzing}
               className={`px-5 py-2 ${isJoining || err ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg disabled:opacity-50 transition duration-150 ease-in-out`}
             >
               {isJoining ? 'Joining...' : (err ? 'Retry Join' : 'Join Interview')}
             </button>
          </div>
        )}

        {(isJoined || isAnalyzing) && (
           <div className="text-center mb-4">
             {isJoined && <p className="text-sm text-green-700 mb-2">Connected to interview.</p>}
             <button
               onClick={() => endInterview(true)}
               disabled={isAnalyzing || !isJoined} 
               className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition duration-150 ease-in-out flex items-center justify-center gap-2 mx-auto"
             >
               {isAnalyzing ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </>
               ) : "End Interview & Get Analysis"}
             </button>
           </div>
        )}

        <div className="bg-gray-200 p-3 rounded-lg h-60 sm:h-80 overflow-y-auto mt-4">
          <h2 className="text-base font-medium mb-2 text-gray-800">Live Transcript</h2>
          <div className="space-y-1">
            {transcript.length > 0 ? (
              transcript.map((t, index) => (
                <p key={index} className={`text-xs sm:text-sm text-gray-800`}>
                  <span className={`font-semibold ${t.speaker === 'agent' ? 'text-purple-700' : 'text-blue-700'}`}>
                    {t.speaker === 'agent' ? 'Interviewer' : 'You'}:
                  </span>{' '}
                  {t.text}
                </p>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">
                {isJoining ? "Connecting..." : isJoined ? "Waiting for conversation..." : "Transcript will appear here once connected..."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}