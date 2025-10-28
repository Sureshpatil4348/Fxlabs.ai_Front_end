import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import SubscriptionExpiredModal from "./components/SubscriptionExpiredModal";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Reset from "./pages/Reset";
import TermsOfService from "./pages/TermsOfService";

function App() {
    const { loading, subscriptionExpired, setSubscriptionExpired } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            {/* Global subscription expired modal */}
            <SubscriptionExpiredModal
                isOpen={!!subscriptionExpired}
                onClose={() => setSubscriptionExpired(false)}
            />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/reset" element={<Reset />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/change-password"
                    element={
                        <ProtectedRoute>
                            <ChangePassword />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    );
}

export default App;
