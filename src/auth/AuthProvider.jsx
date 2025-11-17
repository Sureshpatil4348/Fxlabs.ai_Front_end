import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import { resolveEdgeFunctionName } from "../utils/resolveFunctionName";
import { isNetworkError } from "../utils/isNetworkError";

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscriptionExpired, setSubscriptionExpired] = useState(false);
    const navigate = useNavigate();
    const subscriptionCheckTimerRef = useRef(null);

    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error("Error getting session:", error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Subscribe to auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (event === "SIGNED_OUT") {
                // Clear subscription check timer on logout
                if (subscriptionCheckTimerRef.current) {
                    clearInterval(subscriptionCheckTimerRef.current);
                    subscriptionCheckTimerRef.current = null;
                }
            }

            // If a sign-in just occurred, start subscription checks (immediate + every 5 mins)
            if (event === "SIGNED_IN") {
                // Reset any previous expired state to keep behavior stateless
                setSubscriptionExpired(false);

                // Start the periodic subscription check
                const checkSubscription = async () => {
                    // Bypass subscription check if env var is set
                    if (
                        process.env.REACT_APP_BYPASS_SUBSCRIPTION_CHECK ===
                        "true"
                    ) {
                        console.log(
                            "Subscription check bypassed via environment variable"
                        );
                        return;
                    }

                    try {
                        const functionName = resolveEdgeFunctionName(
                            "get-subscription-status"
                        );

                        // Re-fetch the current session to get fresh token
                        const { data: s } = await supabase.auth.getSession();
                        const token = s?.session?.access_token;

                        const { data: subCheckData, error: subCheckError } =
                            await supabase.functions.invoke(
                                functionName,
                                token
                                    ? {
                                          headers: {
                                              Authorization: `Bearer ${token}`,
                                          },
                                      }
                                    : undefined
                            );

                        if (subCheckError) {
                            if (isNetworkError(subCheckError)) {
                                console.warn(
                                    "Subscription check skipped due to network error:",
                                    subCheckError
                                );
                                return;
                            }

                            if (subCheckError.status === 401) {
                                console.warn(
                                    "Session unauthorized during subscription check. Signing out."
                                );
                                await supabase.auth.signOut();
                                navigate("/");
                                return;
                            }

                            console.error(
                                "Subscription check failed with non-network error:",
                                subCheckError
                            );
                            return;
                        }

                        if (!subCheckData) {
                            console.warn(
                                "Subscription check returned no data. Skipping expiration handling."
                            );
                            return;
                        }

                        if (subCheckData.subscription_status === "expired") {
                            console.warn(
                                "Subscription expired according to server. Logging out."
                            );
                            setSubscriptionExpired(true);
                            await supabase.auth.signOut();
                            navigate("/");
                        }
                    } catch (err) {
                        console.error("Subscription check failed:", err);
                    }
                };

                // Run immediately
                checkSubscription();

                // Then set up recurring check every 5 minutes
                if (subscriptionCheckTimerRef.current) {
                    clearInterval(subscriptionCheckTimerRef.current);
                }
                subscriptionCheckTimerRef.current = setInterval(
                    checkSubscription,
                    5 * 60 * 1000
                );

                // Navigate to dashboard if on home
                try {
                    const path =
                        typeof window !== "undefined"
                            ? window.location.pathname
                            : "";
                    if (path === "/") {
                        navigate("/dashboard", { replace: true });
                    }
                } catch (_e) {
                    // no-op; navigation best-effort
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    // Cleanup subscription timer on unmount
    useEffect(() => {
        return () => {
            if (subscriptionCheckTimerRef.current) {
                clearInterval(subscriptionCheckTimerRef.current);
                subscriptionCheckTimerRef.current = null;
            }
        };
    }, []);

    const value = {
        user,
        session,
        loading,
        subscriptionExpired,
        setSubscriptionExpired,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
