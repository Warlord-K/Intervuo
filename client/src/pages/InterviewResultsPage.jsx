import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Star, TrendingUp, TrendingDown, MessageSquare, BookOpen, Activity, BarChart3, BrainCircuit, ClipboardList } from 'lucide-react';

const ScoreStars = ({ score }) => {
  if (score === null || score === undefined || score < 1) {
    return <span className="text-sm text-gray-500 italic">N/A</span>;
  }
  const filledStars = Math.round(score / 2); 
  const totalStars = 5;
  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < filledStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">({score}/10)</span>
    </div>
  );
};


export default function InterviewResultsPage() {
  const location = useLocation();
  const { analysis, transcript, interviewDetails, error } = location.state || {};

  if (!transcript) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Error Loading Results</h1>
          <p className="text-gray-600 mb-4">Could not find interview data. Please go back to the dashboard.</p>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Analysis</h1>
           {interviewDetails && (
                <p className="text-md text-gray-600">
                    For {interviewDetails.role} at {interviewDetails.company} ({interviewDetails.level}, {interviewDetails.interviewType} type)
                </p>
           )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-800 mb-6">
            <BrainCircuit className="text-purple-600" /> AI Feedback
          </h2>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Analysis Error:</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {analysis ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-gray-500"/> Summary
                </h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{analysis.summary || "No summary provided."}</p>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" /> Strengths
                  </h3>
                  <ul className="list-disc list-inside space-y-2 pl-2 text-gray-600">
                    {analysis.analysis?.strengths?.length > 0 ? (
                      analysis.analysis.strengths.map((item, index) => <li key={`strength-${index}`}>{item}</li>)
                    ) : (
                      <li className="italic text-gray-500">No specific strengths identified by AI.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" /> Areas for Improvement
                  </h3>
                  <ul className="list-disc list-inside space-y-2 pl-2 text-gray-600">
                    {analysis.analysis?.areas_for_improvement?.length > 0 ? (
                      analysis.analysis.areas_for_improvement.map((item, index) => <li key={`weakness-${index}`}>{item}</li>)
                    ) : (
                      <li className="italic text-gray-500">No specific areas for improvement identified by AI.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-500"/> Performance Metrics
                </h3>
                <div className="space-y-3">
                    {analysis.scores && Object.entries(analysis.scores).map(([metric, score]) => (
                         <div key={metric} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                            <span className="text-sm font-medium capitalize text-gray-800">{metric.replace('_', ' ')}</span>
                            <ScoreStars score={score} />
                        </div>
                    ))}
                     {!analysis.scores && <p className="italic text-gray-500">No scores provided.</p>}
                </div>
              </div>
            </>
          ) : (
            !error && <p className="text-center text-gray-500 italic">AI analysis is not available for this interview.</p>
          )}
        </div>


        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-800 mb-4">
            <BookOpen className="text-purple-600"/> Full Transcript
          </h2>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto space-y-2">
            {transcript.map((t, index) => (
              <p key={index} className="text-sm text-gray-800">
                <span className={`font-semibold ${t.speaker === 'agent' ? 'text-purple-700' : 'text-blue-700'}`}>
                  {t.speaker === 'agent' ? 'Interviewer' : 'You'}:
                </span>{' '}
                {t.text}
              </p>
            ))}
          </div>
        </div>

         <div className="mt-8 text-center">
            <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
            >
                Back to Dashboard
            </Link>
         </div>

      </div>
    </div>
  );
}