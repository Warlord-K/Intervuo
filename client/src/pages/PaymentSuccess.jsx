import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PaymentSuccess() {
    const query = new URLSearchParams(useLocation().search);
    const reference = query.get("reference");
    const navigate = useNavigate();

    // Redirect to dashboard after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/dashboard");
        }, 3000);

        return () => clearTimeout(timer); // Clear timeout if component unmounts
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 Payment Successful!</h1>
                <p className="text-gray-700 mb-6">
                    Thank you for your payment. Your transaction was successful!
                </p>
                {reference && (
                    <p className="text-sm text-gray-600">
                        <strong>Reference ID:</strong> {reference}
                    </p>
                )}
                <div className="mt-4">
                    <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;
