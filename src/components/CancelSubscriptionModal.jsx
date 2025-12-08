import React, { useState } from "react";
import { AlertTriangle, Loader } from "lucide-react";

const CancelSubscriptionModal = ({ isOpen, onClose, onConfirm }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCancel = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get the current user session
            const {
                data: { session },
                error: sessionError,
            } = await (
                await import("../lib/supabaseClient")
            ).supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error("Not authenticated");
            }

            // Call the cancel subscription edge function
            const cancelFunctionUrl =
                process.env.REACT_APP_CANCEL_SUBSCRIPTION_FUNCTION_URL;

            if (!cancelFunctionUrl) {
                throw new Error("Cancel subscription endpoint not configured");
            }

            const response = await fetch(cancelFunctionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel subscription");
            }

            // Success
            console.log("✅ Subscription cancelled:", data);
            onConfirm(data);
            setIsLoading(false);
            onClose();
        } catch (err) {
            console.error("❌ Error cancelling subscription:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-2xl p-8 max-w-md w-full transition-all duration-300 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-xl border border-red-200/50 dark:border-red-700/50 shadow-2xl">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#19235d] dark:text-white">
                            Cancel Subscription?
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* Warning Message */}
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Warning:</strong> Cancelling your subscription
                        will immediately stop your access to all FxLabs premium
                        features. This action cannot be undone. Are you sure you
                        want to proceed?
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-[#19235d] text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-[#19235d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Keep Subscription
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Cancelling...</span>
                            </>
                        ) : (
                            "Yes, Cancel It"
                        )}
                    </button>
                </div>

                {/* Info Text */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    If you have any feedback or concerns, please contact our
                    support team.
                </p>
            </div>
        </div>
    );
};

export default CancelSubscriptionModal;
