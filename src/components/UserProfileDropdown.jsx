import { Settings, LogOut, AlertTriangle, Loader } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import useMarketStore from "../store/useMarketStore";

const UserProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    const [hasReadNotice, setHasReadNotice] = useState(false);
    const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(null);
    const dropdownRef = useRef(null);
    const { user, subscriptionStatus } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            // Close all WebSocket connections before signing out
            const { disconnectAll } = useMarketStore.getState();
            if (disconnectAll) {
                disconnectAll();
            }

            await supabase.auth.signOut();
            navigate("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleSettings = () => {
        setShowSettings(true);
        setIsOpen(false);
    };

    const handleCancelSubscription = async () => {
        setIsCancelLoading(true);
        setCancelError(null);

        try {
            // Get the current user's access token
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
                throw new Error("Not authenticated");
            }

            const cancelFunctionUrl =
                process.env.REACT_APP_CANCEL_SUBSCRIPTION_FUNCTION_URL;
            const authToken = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!cancelFunctionUrl) {
                throw new Error("Cancel subscription endpoint not configured");
            }

            if (!authToken) {
                throw new Error("Supabase anon key not configured");
            }

            const response = await fetch(cancelFunctionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`, // Gateway auth with anon key
                    "X-User-Token": session.access_token, // User JWT token
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel subscription");
            }

            if (data.success) {
                if (data.is_already_cancelled) {
                    // Case: Subscription was already cancelled
                    console.log(
                        "ℹ️ Subscription already cancelled:",
                        data.message
                    );
                    setCancelError(data.message);
                } else {
                    // Case: Subscription successfully cancelled
                    console.log("✅ Subscription cancelled:", data);
                    setCancelError(
                        "Subscription cancelled successfully. You will retain access until the end of your billing period."
                    );
                }

                // Do NOT auto-close the modal - let user dismiss it manually
            } else {
                throw new Error(data.error || "Failed to cancel subscription");
            }
        } catch (err) {
            console.error("❌ Error cancelling subscription:", err);
            setCancelError(
                err instanceof Error
                    ? err.message
                    : "An error occurred while processing your request"
            );
        } finally {
            setIsCancelLoading(false);
        }
    };

    const handleUpgradeCheckout = async (planId) => {
        setCheckoutLoadingPlan(planId);
        try {
            const functionUrl =
                process.env
                    .REACT_APP_SUPABASE_STRIPE_CREATE_CHECKOUT_FUNCTION_URL;
            const authToken = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!functionUrl) {
                throw new Error("Checkout endpoint not configured");
            }

            let payload = {};
            if (planId === "quarterly") {
                payload = {
                    planId: process.env.REACT_APP_STRIPE_PLAN_ID_3M,
                };
            } else if (planId === "yearly") {
                payload = {
                    planId: process.env.REACT_APP_STRIPE_PLAN_ID_1Y,
                };
            }

            const response = await fetch(functionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to create checkout session"
                );
            }

            if (data?.sessionUrl) {
                console.log("Redirecting to checkout:", data.sessionUrl);
                window.open(data.sessionUrl, "_blank");
                setShowUpgradeModal(false);
            } else {
                throw new Error("No checkout URL returned from API");
            }
        } catch (error) {
            console.error("Error creating checkout session:", error);
        } finally {
            setCheckoutLoadingPlan(null);
        }
    };

    // Get user initials
    const getUserInitials = (email) => {
        if (!email) return "U";
        const parts = email.split("@")[0];
        return parts.substring(0, 2).toUpperCase();
    };

    // Connection status for showing connecting animation on avatar
    const connectionStatus = useMarketStore(
        (state) => state.globalConnectionState.status
    );
    const isConnecting =
        connectionStatus === "CONNECTING" || connectionStatus === "RETRYING";

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                {/* Avatar Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#19235d] hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                    aria-label="Account menu"
                >
                    {/* Spinning ring when connecting */}
                    {isConnecting && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-1 rounded-full border-2 border-emerald-500/70 border-t-transparent animate-spin"
                        />
                    )}
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg border-2 border-white/20">
                        {getUserInitials(user?.email)}
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-1 z-50 transition-all duration-300 bg-white dark:bg-[#19235d] border border-emerald-200/50 dark:border-emerald-700/50">
                        <button
                            onClick={handleSettings}
                            className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg mx-1"
                        >
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                        </button>

                        {/* Show Upgrade option only if user is on trial */}
                        {subscriptionStatus === "trial" && (
                            <button
                                onClick={() => {
                                    setShowUpgradeModal(true);
                                    setIsOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 hover:text-amber-700 dark:hover:text-amber-300 rounded-lg mx-1"
                            >
                                <svg
                                    className="w-4 h-4 mr-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                                Upgrade Now
                            </button>
                        )}

                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-3 text-sm transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-lg mx-1"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* Settings Modal - Rendered via Portal to avoid layout constraints */}
            {showSettings &&
                createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="rounded-2xl p-8 max-w-md w-full transition-all duration-300 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-2xl">
                            <div className="flex items-center justify-between mb-0">
                                <h2
                                    className={`text-2xl font-bold transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-[#19235d]"
                                    }`}
                                >
                                    Account Settings
                                </h2>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className={`text-2xl font-bold transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-400 hover:text-gray-200"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Account Information */}
                            <div className="rounded-xl p-6 mb-6 transition-all duration-300 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                                <h3
                                    className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-[#19235d]"
                                    }`}
                                >
                                    Account Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span
                                            className={`transition-colors duration-300 ${
                                                isDarkMode
                                                    ? "text-gray-300"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            Email:
                                        </span>
                                        <span
                                            className={`font-medium transition-colors duration-300 ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : "text-[#19235d]"
                                            }`}
                                        >
                                            {user?.email}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span
                                            className={`transition-colors duration-300 ${
                                                isDarkMode
                                                    ? "text-gray-300"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            Last Sign In:
                                        </span>
                                        <span
                                            className={`transition-colors duration-300 ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : "text-[#19235d]"
                                            }`}
                                        >
                                            {user?.last_sign_in_at
                                                ? new Date(
                                                      user.last_sign_in_at
                                                  ).toLocaleString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Management */}
                            <div className="rounded-xl p-6 mb-6 transition-all duration-300 bg-gradient-to-r from-red-50 via-pink-50 to-red-50 dark:from-red-900/20 dark:via-pink-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-700/50">
                                <h3
                                    className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-[#19235d]"
                                    }`}
                                >
                                    Subscription
                                </h3>
                                <p
                                    className={`text-sm mb-4 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-600"
                                    }`}
                                >
                                    Manage your subscription or cancel your
                                    plan.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowCancelModal(true);
                                    }}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
                                >
                                    Cancel Subscription
                                </button>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowSettings(false);
                                        navigate("/change-password");
                                    }}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                >
                                    Change Password
                                </button>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className={`flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                                        isDarkMode
                                            ? "bg-[#19235d] text-gray-200 hover:bg-[#19235d] focus:ring-gray-400 focus:ring-offset-[#19235d]"
                                            : "bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500 focus:ring-offset-white"
                                    }`}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Cancel Subscription Modal - Separate Portal */}
            {showCancelModal &&
                createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="rounded-2xl p-8 max-w-md w-full transition-all duration-300 bg-white/95 dark:bg-[#19235d]/95 backdrop-blur-xl border border-red-200/50 dark:border-red-700/50 shadow-2xl flex flex-col max-h-96">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <h3
                                        className={`font-bold text-lg ${
                                            isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                        }`}
                                    >
                                        Subscription Cancellation
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setHasReadNotice(false);
                                        setCancelError(null);
                                    }}
                                    className={`text-2xl font-bold flex-shrink-0 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-400 hover:text-gray-200"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    ×
                                </button>
                            </div>

                            <div
                                className={`space-y-2 text-xs leading-relaxed mb-4 overflow-y-auto pr-2 flex-1 ${
                                    isDarkMode
                                        ? "text-gray-200"
                                        : "text-gray-800"
                                }`}
                            >
                                <p>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        Notice:
                                    </span>
                                    <span>
                                        {" "}
                                        By confirming, you request to cancel
                                        your FxLabs subscription&apos;s
                                        automatic renewal through Stripe,
                                        terminating future recurring payments.
                                    </span>
                                </p>
                                <p>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        Effective Date:
                                    </span>
                                    <span>
                                        {" "}
                                        Your subscription will not terminate
                                        immediately. Access to premium features
                                        will remain active until the end of your
                                        current billing period.
                                    </span>
                                </p>
                                <p>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        Refund Policy:
                                    </span>
                                    <span>
                                        {" "}
                                        No refunds will be issued for the
                                        remaining balance. Full access to
                                        premium features is retained until your
                                        subscription period expires naturally.
                                    </span>
                                </p>
                                <p>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        Reactivation:
                                    </span>
                                    <span>
                                        {" "}
                                        You may reactivate your subscription
                                        before your current period expires by
                                        purchasing a new plan.
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mb-4 px-2">
                                {!cancelError && (
                                    <>
                                        <input
                                            type="checkbox"
                                            id="readNotice"
                                            checked={hasReadNotice}
                                            onChange={(e) =>
                                                setHasReadNotice(
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 rounded cursor-pointer"
                                        />
                                        <label
                                            htmlFor="readNotice"
                                            className={`text-xs cursor-pointer ${
                                                isDarkMode
                                                    ? "text-gray-300"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            I have read and understand all the
                                            terms above
                                        </label>
                                    </>
                                )}
                            </div>

                            {!cancelError && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setHasReadNotice(false);
                                            setCancelError(null);
                                        }}
                                        disabled={isCancelLoading}
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Keep Subscription
                                    </button>
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={
                                            isCancelLoading || !hasReadNotice
                                        }
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCancelLoading ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Cancelling...</span>
                                            </>
                                        ) : (
                                            "Confirm Cancellation"
                                        )}
                                    </button>
                                </div>
                            )}

                            {cancelError && (
                                <div
                                    className={`mt-4 p-4 border rounded-lg ${
                                        cancelError.includes("already")
                                            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                                            : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                                    }`}
                                >
                                    <p
                                        className={`text-sm ${
                                            cancelError.includes("already")
                                                ? "text-blue-700 dark:text-blue-300"
                                                : "text-red-700 dark:text-red-300"
                                        }`}
                                    >
                                        {cancelError}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

            {/* Upgrade Subscription Modal */}
            {showUpgradeModal &&
                createPortal(
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="rounded-2xl p-8 max-w-2xl w-full transition-all duration-300 bg-white dark:bg-[#19235d]">
                            <div className="flex items-center justify-between mb-6">
                                <h2
                                    className={`text-2xl font-bold transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-[#19235d]"
                                    }`}
                                >
                                    Choose Your Plan
                                </h2>
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className={`text-2xl font-bold transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-400 hover:text-gray-200"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Pricing Cards */}
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {/* 3 Months Plan */}
                                <div
                                    className={`rounded-xl p-6 border-2 transition-all duration-300 flex flex-col ${
                                        isDarkMode
                                            ? "bg-gray-800/50 border-emerald-600/30 hover:border-emerald-500"
                                            : "bg-gray-50 border-emerald-200 hover:border-emerald-400"
                                    }`}
                                >
                                    <h3
                                        className={`text-xl font-bold mb-2 ${
                                            isDarkMode
                                                ? "text-white"
                                                : "text-[#19235d]"
                                        }`}
                                    >
                                        3 Months
                                    </h3>
                                    <div className="mb-4">
                                        <span
                                            className={`text-3xl font-bold ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : "text-[#19235d]"
                                            }`}
                                        >
                                            $199
                                        </span>
                                        <span
                                            className={`text-sm ml-2 ${
                                                isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            for 3 months
                                        </span>
                                    </div>
                                    <p
                                        className={`text-sm mb-6 flex-grow ${
                                            isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        Best value for serious traders
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleUpgradeCheckout("quarterly")
                                        }
                                        disabled={
                                            checkoutLoadingPlan === "quarterly"
                                        }
                                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {checkoutLoadingPlan === "quarterly" ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            "Upgrade Now"
                                        )}
                                    </button>
                                </div>

                                {/* 1 Year Plan */}
                                <div
                                    className={`rounded-xl p-6 border-2 relative transition-all duration-300 flex flex-col ${
                                        isDarkMode
                                            ? "bg-gradient-to-br from-emerald-900/30 to-green-900/20 border-emerald-500/50 hover:border-emerald-400"
                                            : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-400 hover:border-emerald-500"
                                    }`}
                                >
                                    <div className="absolute -top-3 right-4">
                                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                    <h3
                                        className={`text-xl font-bold mb-2 ${
                                            isDarkMode
                                                ? "text-white"
                                                : "text-[#19235d]"
                                        }`}
                                    >
                                        1 Year
                                    </h3>
                                    <div className="mb-4">
                                        <span
                                            className={`text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent`}
                                        >
                                            $499
                                        </span>
                                        <span
                                            className={`text-sm ml-2 ${
                                                isDarkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            for 1 year
                                        </span>
                                    </div>
                                    <p
                                        className={`text-sm mb-6 flex-grow ${
                                            isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        Maximum savings for committed traders
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleUpgradeCheckout("yearly")
                                        }
                                        disabled={
                                            checkoutLoadingPlan === "yearly"
                                        }
                                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {checkoutLoadingPlan === "yearly" ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            "Upgrade Now"
                                        )}
                                    </button>
                                </div>
                            </div>

                            <p
                                className={`text-xs mb-6 rounded-lg p-4 ${
                                    isDarkMode
                                        ? "bg-blue-900/20 border border-blue-700/50 text-blue-300"
                                        : "bg-blue-50 border border-blue-200 text-blue-700"
                                }`}
                            >
                                <span className="block font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                    Important:
                                </span>
                                During checkout, please use the same email
                                address intended for your FxLabs account. This
                                will be your registered email. After successful
                                payment, your invoice will be sent to the same
                                email. Please check your <strong>Inbox</strong>{" "}
                                or <strong>Spam</strong> folder.
                            </p>

                            <p
                                className={`text-center text-xs ${
                                    isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                }`}
                            >
                                You will be redirected to the secure Stripe
                                checkout page to complete your purchase.
                            </p>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default UserProfileDropdown;
