import React from 'react';
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Building2, History,} from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Master Your <span className="text-purple-700">Tech Interviews</span> with AI-Powered Practice
            </h1>
            <p className="text-lg text-gray-600">
              Get personalized mock interviews, instant feedback, and comprehensive performance analysis to land your dream tech role.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">

              <Link to="/signin" className="flex items-center justify-center gap-2 bg-purple-700 text-white px-8 py-3 rounded-lg hover:bg-purple-800 transition">
                          Start Practicing
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button className="flex items-center justify-center gap-2 border-2 border-purple-700 text-purple-700 px-8 py-3 rounded-lg hover:bg-purple-50 transition" onClick={URL => window.open('https://drive.google.com/file/d/1OieH6Ef2CFyCY8BPPiXYdR3Ecr4f0yOu/view?usp=sharing', '_blank')}>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
              alt="Technical interview preparation with AI"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Interview in Progress</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Intervuo?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Code2 className="w-6 h-6 text-purple-700" />}
              title="Technical Interviews"
              description="Practice coding challenges and system design questions with real-time feedback."
            />
            <FeatureCard
              icon={<Building2 className="w-6 h-6 text-purple-700" />}
              title="Company-Specific"
              description="Tailored interview experiences based on your target company's style."
            />
            <FeatureCard
              icon={<History className="w-6 h-6 text-purple-700" />}
              title="Progress Tracking"
              description="Monitor your improvement with detailed performance analytics."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step number="1" title="Sign Up" description="Create your account and set your preferences" />
            <Step number="2" title="Choose Role" description="Select your target position and company" />
            <Step number="3" title="Practice" description="Start mock interviews with AI interviewer" />
            <Step number="4" title="Improve" description="Get feedback and track your progress" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Ace Your Next Interview?</h2>
          <p className="text-purple-100 mb-8">Join thousands of developers who have improved their interview skills with Intervuo</p>
          <button className="bg-white text-purple-700 px-8 py-3 rounded-lg hover:bg-purple-50 transition">
            Get Started Free
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-purple-50 p-6 rounded-xl">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-xl font-bold text-purple-700">{number}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default LandingPage;