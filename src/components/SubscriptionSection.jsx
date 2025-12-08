import React, { useState, useEffect } from "react";

import FreeTrialPopup from "./FreeTrialPopup";
import SubscriptionVerificationModal from "./SubscriptionVerificationModal";

const SubscriptionSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [_userLocation, setUserLocation] = useState(null);
    const [loadingPlanId, setLoadingPlanId] = useState(null);
    const [_isVerificationModalOpen, _setIsVerificationModalOpen] =
        useState(false);
    const [_selectedPlan, _setSelectedPlan] = useState(null);

    const isEmbeddedStripeEnabled =
        (process.env.REACT_APP_ENABLE_EMBEDDED_STRIPE || "false") === "true";

    // Fetch user's IP and location information
    useEffect(() => {
        if (isEmbeddedStripeEnabled) return;

        const fetchUserLocation = async () => {
            try {
                console.log("🌍 Fetching user IP and location information...");

                // Using ipapi.co for IP geolocation with cache busting
                const timestamp = Date.now();
                const response = await fetch(
                    `https://ipapi.co/json/?t=${timestamp}`
                );
                const data = await response.json();

                if (process.env.NODE_ENV === "development") {
                    console.log("📍 User Location:", data.country_code);
                }

                setUserLocation(data);

                // Check if user is from India
                if (data.country_code === "IN") {
                    console.log(
                        "🇮🇳 User is from India - India specific pricing should be shown"
                    );
                } else {
                    console.log(
                        `🌎 User is from ${data.country_name} (${data.country_code}) - International pricing with Free Trial should be shown`
                    );
                }
            } catch (error) {
                console.error("❌ Error fetching user location:", error);

                // Fallback: Try another IP service
                try {
                    console.log("🔄 Trying fallback IP service...");
                    const fallbackTimestamp = Date.now();
                    const fallbackResponse = await fetch(
                        `https://ipinfo.io/json?t=${fallbackTimestamp}`
                    );
                    const fallbackData = await fallbackResponse.json();

                    if (process.env.NODE_ENV === "development") {
                        console.log(
                            "📍 Fallback Location:",
                            fallbackData.country
                        );
                    }
                    setUserLocation(fallbackData);

                    if (fallbackData.country === "IN") {
                        console.log(
                            "🇮🇳 User is from India (fallback) - India specific pricing should be shown"
                        );
                    } else {
                        console.log(
                            `🌎 User is from ${fallbackData.country} (fallback) - International pricing with Free Trial should be shown`
                        );
                    }
                } catch (fallbackError) {
                    console.error(
                        "❌ Fallback IP service also failed:",
                        fallbackError
                    );
                }
            }
        };

        fetchUserLocation();
    }, [isEmbeddedStripeEnabled]);

    // Get pricing based on user location
    const getPricingPlans = () => {
        if (isEmbeddedStripeEnabled) {
            return [
                {
                    id: "quarterly",
                    name: "3 Months Plan",
                    duration: "3 Months",
                    price: "199",
                    period: "for 3 months",
                    popular: false,
                    description: "Best value for serious traders",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
                {
                    id: "yearly",
                    name: "1 Year Plan",
                    duration: "12 Months",
                    price: "499",
                    period: "for 1 year",
                    popular: true,
                    badge: "MOST POPULAR",
                    description: "Maximum savings for committed traders",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
            ];
        }

        const isIndianUser = _userLocation?.country_code === "IN";

        if (isIndianUser) {
            // Indian pricing (INR)
            return [
                {
                    id: "quarterly",
                    name: "3 Months Plan",
                    duration: "3 Months",
                    originalPrice: "25000",
                    price: "16999",
                    period: "for 3 months",
                    savings: "SAVE ₹8,001",
                    popular: false,
                    description: "Best value for serious traders",
                    link: "https://tagmango.app/0c590f2c10",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
                {
                    id: "yearly",
                    name: "1 Year Plan",
                    duration: "12 Months",
                    originalPrice: "79999",
                    price: "49999",
                    period: "for 1 year",
                    savings: "SAVE ₹30,000",
                    popular: true,
                    badge: "MOST POPULAR",
                    description: "Maximum savings for committed traders",
                    link: "https://tagmango.app/79169abbdf",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
            ];
        } else {
            // Non-Indian pricing (USD) - Now includes Free Trial option
            return [
                {
                    id: "free",
                    name: "Free Trial",
                    duration: "1 Month",
                    price: "0",
                    period: "Free for 1 month",
                    popular: false,
                    description: "Experience the full power of our platform",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
                {
                    id: "quarterly",
                    name: "3 Months Plan",
                    duration: "3 Months",
                    price: "199",
                    period: "for 3 months",
                    popular: false,
                    description: "Best value for serious traders",
                    link: "https://buy.stripe.com/28EdR9aYHg8ja11gwG57W0d",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
                {
                    id: "yearly",
                    name: "1 Year Plan",
                    duration: "12 Months",
                    price: "499",
                    period: "for 1 year",
                    popular: true,
                    badge: "MOST POPULAR",
                    description: "Maximum savings for committed traders",
                    link: "https://buy.stripe.com/28EfZh7Mv1dpc994NY57W0e",
                    features: [
                        "TradingView Integration",
                        "RSI Analysis & Tracking",
                        "Currency Strength Meter",
                        "Lot Size Calculator",
                        "All-in-One Indicator Analysis",
                        "Market Session Tracker",
                        "Live Email Notifications",
                        "News & Market Alerts",
                        "Multi-Timeframe Analysis",
                        "Professional Dashboard",
                    ],
                },
            ];
        }
    };

    const pricingPlans = getPricingPlans();
    const isIndianUser =
        !isEmbeddedStripeEnabled && _userLocation?.country_code === "IN";
    const isTwoPlans = pricingPlans.length === 2;
    const gridColsClass = isTwoPlans ? "md:grid-cols-2" : "md:grid-cols-3";
    const gridWidthClass = isTwoPlans ? "max-w-4xl" : "max-w-7xl";

    // Debug logging
    // if (process.env.NODE_ENV === "development") {
    //     console.log("🔍 Debug Info:", {
    //         userCountry: _userLocation?.country_code,
    //         isIndianUser,
    //         pricingPlansCount: pricingPlans.length,
    //         pricingPlans: pricingPlans.map((p) => ({
    //             id: p.id,
    //             name: p.name,
    //             price: p.price,
    //         })),
    //         timestamp: new Date().toISOString(),
    //     });
    // }

    return (
        <section className="py-12 md:py-16 px-4 md:px-6 w-full transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                {/* Section Header */}
                <div className="text-center mb-16">
                    {/* Premium Badge */}
                    <div className="inline-flex items-center justify-center px-6 py-3 bg-white/80 dark:bg-[#19235d]/80 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-full shadow-sm mb-6">
                        <i className="fas fa-crown text-emerald-500 mr-2"></i>
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm tracking-wide">
                            Get Your AI Trading Edge
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#19235d] dark:text-white">
                        Choose Your{" "}
                        <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 dark:from-emerald-400 dark:via-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
                            Trading Plan
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        All plans include every feature. Choose based on your
                        commitment level and save more with longer
                        subscriptions.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="flex justify-center">
                    <div
                        className={`grid grid-cols-1 ${gridColsClass} items-center gap-6 lg:gap-4 ${gridWidthClass}`}
                    >
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative transition-all duration-500 ${
                                    plan.popular
                                        ? "md:scale-[1.05] md:-translate-y-2"
                                        : ""
                                }`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                                        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-xs font-bold tracking-wider shadow-lg whitespace-nowrap">
                                            {plan.badge}
                                        </div>
                                    </div>
                                )}

                                {/* Card Container with Gradient Border Effect */}
                                <div
                                    className={`relative rounded-3xl transition-all duration-300 h-full ${
                                        plan.popular
                                            ? "p-[3px] bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.4)] hover:shadow-[0_25px_70px_-15px_rgba(16,185,129,0.5)]"
                                            : "p-[2px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-[#19235d] dark:via-[#19235d] dark:to-[#19235d] shadow-lg hover:shadow-xl hover:-translate-y-1"
                                    }`}
                                >
                                    <div
                                        className={`relative rounded-3xl h-full backdrop-blur-xl transition-all duration-300 flex flex-col ${
                                            plan.popular
                                                ? "bg-white dark:bg-[#19235d] p-14"
                                                : "bg-white/90 dark:bg-[#19235d]/90 p-12"
                                        }`}
                                    >
                                        {/* Plan Name & Badge */}
                                        <div className="text-center mb-8">
                                            {!plan.popular && plan.badge && (
                                                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/20 dark:to-purple-400/20 rounded-full mb-2">
                                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                        {plan.badge}
                                                    </span>
                                                </div>
                                            )}

                                            <h3
                                                className={`text-3xl font-bold mb-3 ${
                                                    plan.popular
                                                        ? "text-[#19235d] dark:text-white"
                                                        : "text-[#19235d] dark:text-gray-100"
                                                }`}
                                            >
                                                {plan.name}
                                            </h3>

                                            <p className="text-base text-gray-600 dark:text-gray-400">
                                                {plan.description}
                                            </p>
                                        </div>

                                        {/* Price Display */}
                                        <div className="text-center mb-8 pb-8 border-b border-gray-200 dark:border-[#19235d]">
                                            {/* Original Price (if exists) */}
                                            {plan.originalPrice && (
                                                <div className="mb-2">
                                                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through">
                                                        {isIndianUser
                                                            ? "₹"
                                                            : "$"}
                                                        {plan.originalPrice}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-center gap-1 mb-1">
                                                <span
                                                    className={`text-2xl font-bold mt-1 ${
                                                        plan.popular
                                                            ? "text-[#19235d] dark:text-white"
                                                            : "text-gray-700 dark:text-gray-200"
                                                    }`}
                                                >
                                                    {isIndianUser ? "₹" : "$"}
                                                </span>
                                                <span
                                                    className={`text-5xl font-bold ${
                                                        plan.popular
                                                            ? "bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                                                            : "text-[#19235d] dark:text-white"
                                                    }`}
                                                >
                                                    {plan.price}
                                                </span>
                                            </div>

                                            <div className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-0.5">
                                                /{plan.period}
                                            </div>
                                            <div
                                                className={`text-base font-semibold ${
                                                    plan.popular
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {plan.duration}
                                            </div>

                                            {plan.savings && (
                                                <div className="mt-2 inline-flex items-center px-3 py-1 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full">
                                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                        {plan.savings}
                                                    </span>
                                                </div>
                                            )}

                                            {plan.period === "lifetime" && (
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    One-time payment, no
                                                    recurring fees
                                                </div>
                                            )}
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-3 mb-6 flex-grow">
                                            {plan.features.map(
                                                (feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-2.5"
                                                    >
                                                        <div
                                                            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                                                                plan.popular
                                                                    ? "bg-gradient-to-br from-emerald-500 to-green-600"
                                                                    : "bg-gradient-to-br from-gray-400 to-gray-500 dark:from-[#19235d] dark:to-[#19235d]"
                                                            }`}
                                                        >
                                                            <i className="fas fa-check text-white text-[9px]"></i>
                                                        </div>
                                                        <span
                                                            className={`text-xs leading-relaxed ${
                                                                plan.popular
                                                                    ? "text-gray-700 dark:text-gray-200 font-medium"
                                                                    : "text-gray-600 dark:text-gray-300"
                                                            }`}
                                                        >
                                                            {feature}
                                                        </span>
                                                    </div>
                                                )
                                            )}

                                            {/* Not Included Features (for non-Indian pricing) */}
                                            {plan.notIncluded &&
                                                plan.notIncluded.map(
                                                    (feature, index) => (
                                                        <div
                                                            key={`not-${index}`}
                                                            className="flex items-start gap-2.5"
                                                        >
                                                            <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5">
                                                                <i className="fas fa-times text-red-600 dark:text-red-400 text-[9px]"></i>
                                                            </div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-through">
                                                                {feature}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                        </div>

                                        {/* CTA Button */}
                                        {plan.link ? (
                                            <a
                                                href={plan.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:-translate-y-1 inline-block text-center ${
                                                    plan.popular
                                                        ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                                                        : "bg-white dark:bg-[#19235d] border-2 border-gray-300 dark:border-[#19235d] text-[#19235d] dark:text-white hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-[#19235d] shadow-md"
                                                }`}
                                            >
                                                Get Started Now
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (plan.id === "free")
                                                        setIsModalOpen(true);
                                                    else if (
                                                        isEmbeddedStripeEnabled
                                                    ) {
                                                        _setSelectedPlan(plan);
                                                        _setIsVerificationModalOpen(
                                                            true
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    loadingPlanId === plan.id
                                                }
                                                className={`w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 ${
                                                    plan.popular
                                                        ? "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40"
                                                        : "bg-white dark:bg-[#19235d] border-2 border-gray-300 dark:border-[#19235d] text-[#19235d] dark:text-white hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-[#19235d] shadow-md"
                                                } ${
                                                    loadingPlanId === plan.id
                                                        ? "opacity-75 cursor-not-allowed"
                                                        : ""
                                                }`}
                                            >
                                                {loadingPlanId === plan.id ? (
                                                    <>
                                                        <svg
                                                            className="animate-spin h-5 w-5 text-current"
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
                                                        <span>
                                                            Processing...
                                                        </span>
                                                    </>
                                                ) : plan.id === "free" ? (
                                                    "Start My Trial"
                                                ) : (
                                                    "Get Started Now"
                                                )}
                                            </button>
                                        )}

                                        {/* Money Back Guarantee .*/}
                                        {plan.id !== "free" && (
                                            <div className="text-center mt-3">
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                                                    <i className="fas fa-shield-alt text-emerald-500"></i>
                                                    propiority support Via Email
                                                    and Telegram
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Free Trial Popup */}
            <FreeTrialPopup
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* Subscription Verification Modal */}
            <SubscriptionVerificationModal
                isOpen={_isVerificationModalOpen}
                onClose={() => _setIsVerificationModalOpen(false)}
                plan={_selectedPlan}
                onProceedToStripe={async (plan) => {
                    setLoadingPlanId(plan.id);
                    try {
                        const functionUrl =
                            process.env
                                .REACT_APP_SUPABASE_STRIPE_CREATE_CHECKOUT_FUNCTION_URL;
                        const authToken =
                            process.env.REACT_APP_SUPABASE_ANON_KEY;

                        let payload = {};

                        if (plan.id === "quarterly") {
                            payload = {
                                planId: process.env.REACT_APP_STRIPE_PLAN_ID_3M,
                            };
                        } else if (plan.id === "yearly") {
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
                                data.error || "Network response was not ok"
                            );
                        }

                        if (data?.sessionUrl) {
                            console.log(
                                "Debug: Redirecting to:",
                                data.sessionUrl
                            );
                            // Open Stripe Checkout URL in a new tab.
                            window.open(data.sessionUrl, "_blank");
                        } else {
                            console.error(
                                "No checkout URL returned from API",
                                data
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Error creating checkout session:",
                            error
                        );
                    } finally {
                        setLoadingPlanId(null);
                    }
                }}
            />
        </section>
    );
};

export default SubscriptionSection;
