import React from "react";

const SubscriptionExpiredModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                <div className="p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900">
                        Subscription Expired
                    </h2>
                    <p className="mb-6 text-sm text-gray-600">
                        Your subscription has ended. Please renew to continue
                        using the platform.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredModal;
