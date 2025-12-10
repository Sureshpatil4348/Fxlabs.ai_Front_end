import React, { useState } from "react";

const SubscriptionVerificationModal = ({
    isOpen,
    onClose,
    plan,
    onProceedToStripe,
}) => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);

    const handleExistingUserSubmit = async () => {
        if (!email.trim()) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        setError("");
        setVerificationResult(null);

        try {
            const verificationApiUrl =
                process.env.REACT_APP_SUBSCRIPTION_VERIFICATION_API_URL;
            const authToken = process.env.REACT_APP_SUPABASE_ANON_KEY;

            const response = await fetch(verificationApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Verification failed");
            }

            const status = data.subscription_status;

            if (status === "expired") {
                // Subscription expired - allow them to proceed
                setVerificationResult({
                    status: "expired",
                    message: "Your subscription has expired.",
                    email: data.email,
                });
            } else if (status === "trial") {
                // Currently on trial period
                setVerificationResult({
                    status: "trial",
                    message: "You are currently on your trial period.",
                    email: data.email,
                });
            } else if (status === "paid") {
                // Subscription still active
                setVerificationResult({
                    status: "paid",
                    message: "Your subscription is currently active.",
                    email: data.email,
                });
            } else {
                throw new Error("Unknown subscription status");
            }
        } catch (err) {
            // Check if it's a "user not found" error - treat as new user
            const errorMessage =
                err.message ||
                "Error verifying subscription. Please try again.";
            if (
                errorMessage.toLowerCase().includes("not found") ||
                errorMessage.toLowerCase().includes("no user")
            ) {
                setIsNewUser(true);
                setError(
                    "You are a new user! Please register to FxLabs to get started."
                );
            } else {
                setError(errorMessage);
            }
            console.error("Subscription verification error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceedFromExpired = () => {
        onProceedToStripe(plan);
        resetModal();
    };

    const resetModal = () => {
        setEmail("");
        setIsLoading(false);
        setVerificationResult(null);
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#19235d] rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#19235d] dark:text-white">
                        Subscription Verification
                    </h2>
                    <button
                        onClick={resetModal}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Combined Step: Email Verification & Skip */}
                {verificationResult === null && (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            Enter your email to verify your subscription status
                        </p>

                        <div>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                disabled={isLoading}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-[#19235d] rounded-lg bg-white dark:bg-[#19235d] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {error && (
                            <div
                                className={`p-3 rounded-lg border ${
                                    isNewUser
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                }`}
                            >
                                <p
                                    className={`text-sm ${
                                        isNewUser
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    {error}
                                </p>
                            </div>
                        )}

                        {!error ? (
                            <>
                                <button
                                    onClick={handleExistingUserSubmit}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        "Continue"
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem(
                                            "checkoutCompleted",
                                            "true"
                                        );
                                        onProceedToStripe(plan);
                                        resetModal();
                                    }}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                                >
                                    Pay and Register
                                </button>
                            </>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                            <span className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                Important:
                            </span>
                            During checkout, please use the email address
                            intended for your FxLabs account. This will be your
                            registered email. After successful payment, your
                            invoice and login credentials will be sent to the
                            same email. Please check your <strong>Inbox</strong>{" "}
                            or <strong>Spam</strong> folder.
                        </p>
                    </div>
                )}

                {/* Step 3: Verification Result */}
                {verificationResult && (
                    <div className="space-y-4">
                        {verificationResult.status === "expired" ? (
                            <>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="text-green-600 dark:text-green-400 text-2xl">
                                            ✓
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-100">
                                                {verificationResult.message}
                                            </p>
                                            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                                                Your subscription has ended. You
                                                can now renew it.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceedFromExpired}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                                >
                                    Proceed to Payment
                                </button>
                            </>
                        ) : verificationResult.status === "trial" ? (
                            <>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="text-blue-600 dark:text-blue-400 text-2xl">
                                            ⏱️
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {verificationResult.message}
                                            </p>
                                            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                                You can upgrade to a paid plan
                                                anytime.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceedFromExpired}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300"
                                >
                                    Upgrade to Paid Plan
                                </button>

                                <button
                                    onClick={() => {
                                        setEmail("");
                                        setVerificationResult(null);
                                    }}
                                    className="w-full py-3 px-4 border-2 border-gray-300 dark:border-[#19235d] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-[#19235d] transition-all duration-300"
                                >
                                    Close
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                    <div className="flex gap-3">
                                        <div className="text-purple-600 dark:text-purple-400 text-2xl">
                                            ✓
                                        </div>
                                        <div>
                                            <p className="font-semibold text-purple-900 dark:text-purple-100">
                                                {verificationResult.message}
                                            </p>
                                            <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                                                Please login directly to access
                                                your account.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setEmail("");
                                        setVerificationResult(null);
                                    }}
                                    className="w-full py-3 px-4 border-2 border-gray-300 dark:border-[#19235d] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-[#19235d] transition-all duration-300"
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionVerificationModal;
