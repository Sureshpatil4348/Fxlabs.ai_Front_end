import { X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { resolveEdgeFunctionName } from "../utils/resolveFunctionName";

const LoginModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const { user, setSubscriptionExpired } = useAuth();
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // Close modal if user is already logged in
    React.useEffect(() => {
        if (user && isOpen) {
            onClose();
        }
    }, [user, isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acceptedTerms) {
            setError("Please accept the Terms & Conditions to continue");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                // Immediately verify subscription status via Edge Function (unless bypassed)
                // Support both REACT_APP_BYPASS_SUBSCRIPTION_CHECK and BYPASS_SUBSCRIPTION_CHECK
                const bypassCheck =
                    process.env.REACT_APP_BYPASS_SUBSCRIPTION_CHECK ===
                        "true" ||
                    process.env.BYPASS_SUBSCRIPTION_CHECK === "true";

                if (!bypassCheck) {
                    // Re-fetch the current session to get fresh token
                    const { data: sessionData } =
                        await supabase.auth.getSession();
                    const token = sessionData?.session?.access_token;

                    if (token) {
                        const functionName = resolveEdgeFunctionName(
                            "get-subscription-status"
                        );
                        const { data: subCheckData, error: subCheckError } =
                            await supabase.functions.invoke(functionName, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                        if (subCheckError) {
                            console.error(
                                "Subscription check error:",
                                subCheckError
                            );
                            // Treat as expired/unverifiable: sign out and show global modal
                            setSubscriptionExpired(true);
                            await supabase.auth.signOut();
                            navigate("/");
                            return;
                        }

                        if (
                            !subCheckData ||
                            subCheckData.subscription_status === "expired"
                        ) {
                            setSubscriptionExpired(true);
                            setError(
                                "Your subscription has expired. You have been logged out."
                            );
                            await supabase.auth.signOut();
                            navigate("/");
                            return;
                        }
                    }
                } else {
                    console.log(
                        "Subscription check bypassed via environment variable"
                    );
                }

                // Valid subscription (or bypassed), ensure flag is cleared (stateless)
                setSubscriptionExpired(false);
                setSuccess("Login successful! Redirecting...");
                setTimeout(() => {
                    onClose();
                    navigate("/dashboard");
                }, 1000);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setPassword("");
        setError("");
        setSuccess("");
        setAcceptedTerms(false);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Modal Container - Proper sizing without height restriction */}
            <div
                className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
                    isDarkMode
                        ? "bg-gradient-to-br from-[#19235d] via-[#19235d] to-black border border-gray-700/50"
                        : "bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200/50"
                }`}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className={`absolute top-4 right-4 transition-colors z-20 p-1 rounded-full ${
                        isDarkMode
                            ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                    }`}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div
                    className={`px-8 pt-8 pb-6 text-center border-b transition-colors duration-300 ${
                        isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
                    }`}
                >
                    <h2
                        className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                            isDarkMode ? "text-white" : "text-[#19235d]"
                        }`}
                    >
                        Welcome Back
                    </h2>
                    <p
                        className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                        Sign in to your trading dashboard
                    </p>
                </div>

                {/* Form */}
                <div className="px-8 py-6 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className={`text-sm font-medium transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                }`}
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail
                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                                        isDarkMode
                                            ? "bg-[#19235d]/50 border border-gray-600/50 text-white placeholder-gray-400"
                                            : "bg-white/80 border border-gray-300/50 text-[#19235d] placeholder-gray-500"
                                    }`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className={`text-sm font-medium transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                }`}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                                        isDarkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={`w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all ${
                                        isDarkMode
                                            ? "bg-[#19235d]/50 border border-gray-600/50 text-white placeholder-gray-400"
                                            : "bg-white/80 border border-gray-300/50 text-[#19235d] placeholder-gray-500"
                                    }`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                                        isDarkMode
                                            ? "text-gray-400 hover:text-white"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div
                                className={`text-sm text-center rounded-lg py-2 px-3 transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-red-400 bg-red-500/10 border border-red-500/20"
                                        : "text-red-600 bg-red-50 border border-red-200"
                                }`}
                            >
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                className={`text-sm text-center rounded-lg py-2 px-3 transition-colors duration-300 ${
                                    isDarkMode
                                        ? "text-green-400 bg-green-500/10 border border-green-500/20"
                                        : "text-green-600 bg-green-50 border border-green-200"
                                }`}
                            >
                                {success}
                            </div>
                        )}

                        {/* Terms & Conditions Checkbox */}
                        <div className="flex items-start space-x-3 py-2">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms-checkbox"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) =>
                                        setAcceptedTerms(e.target.checked)
                                    }
                                    className={`w-4 h-4 rounded border-2 focus:ring-2 focus:ring-green-500/50 transition-colors ${
                                        isDarkMode
                                            ? "bg-[#19235d]/50 border-gray-600/50 text-green-500 focus:border-green-500"
                                            : "bg-white/80 border-gray-300/50 text-green-500 focus:border-green-500"
                                    }`}
                                />
                            </div>
                            <label
                                htmlFor="terms-checkbox"
                                className={`text-sm leading-5 transition-colors ${
                                    isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                }`}
                            >
                                I agree to the{" "}
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/terms-of-service")
                                    }
                                    className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 underline transition-colors"
                                >
                                    Terms & Conditions
                                </button>{" "}
                                and{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/privacy-policy")}
                                    className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 underline transition-colors"
                                >
                                    Privacy Policy
                                </button>
                            </label>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading || !acceptedTerms}
                            className={`w-full py-3 font-medium rounded-lg transition-all duration-300 transform shadow-lg ${
                                acceptedTerms && !loading
                                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:scale-[1.02] hover:shadow-green-500/25"
                                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        {/* Forgot Password */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate("/forgot");
                                }}
                                className={`text-sm transition-colors ${
                                    isDarkMode
                                        ? "text-gray-400 hover:text-green-400"
                                        : "text-gray-600 hover:text-green-600"
                                }`}
                            >
                                Forgot your password?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoginModal;
