import React from 'react';
import axios from "axios";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { Check, X } from 'lucide-react';

export default function PricingPage() {
  const checkoutHandler = async (amount) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in to proceed with payment.");
      // Optionally redirect to login:
      // window.location.href = "/login";
      return;
    }

    try {
      // Get Razorpay key from backend
      const { data: keyData } = await axios.get("/api/v1/getKey");
      const { key } = keyData;

      // Create order in the backend
      const { data: orderData } = await axios.post("/api/v1/payment/process", {
        amount
      });
      const { order } = orderData;

      // Configure Razorpay options
      const options = {
        key, // Razorpay key
        amount: amount * 100, // Amount in paisa
        currency: "INR",
        name: "Crack It AI",
        description: "Test Transaction",
        order_id: order.id, // Order ID generated from backend
        callback_url: "http://localhost:5210/api/v1/paymentVerification", // URL to verify payment
        prefill: {
          name: user.displayName || "User",
          email: user.email,
          contact: user.phoneNumber || "9999999999",
        },
        theme: {
          color: "#F37254",
        },
      };

      // Open Razorpay payment gateway
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Something went wrong while processing payment. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          {/* <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1> */}
          <p className="text-lg text-gray-600">Choose the plan that's right for you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Free Tier</h2>
              <p className="text-gray-600 mb-4">Perfect for getting started</p>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-gray-900">₹0</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { included: true, text: '2 AI Interviews per month' },
                  { included: true, text: 'Basic Transcript' },
                  { included: false, text: 'Detailed Feedback' },
                  { included: false, text: 'Priority Support' },
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-500'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                >
                Current Plan
              </button>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="bg-white rounded-2xl shadow-lg relative border-2 border-purple-500 transition-transform duration-300 hover:scale-105">
            <div className="absolute -top-4 right-4">
              <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded-full">
                
                Popular
              </span>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-purple-700 mb-3">Pro Tier</h2>
              <p className="text-gray-600 mb-4">For serious practitioners</p>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-gray-900">₹3000</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { included: true, text: 'Unlimited AI Interviews' },
                  { included: true, text: 'Detailed Transcript' },
                  { included: true, text: 'AI-Powered Feedback' },
                  { included: true, text: 'Priority Support' },
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
              onClick={() => checkoutHandler(3000)}>
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
