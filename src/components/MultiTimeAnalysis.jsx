import { Sun, Moon, Globe2 } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";

import widgetTabRetentionService from "../services/widgetTabRetentionService";
import { CardTitle } from "./ui/card";

const ForexMarketTimeZone = () => {
    const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");
    const [is24Hour, setIs24Hour] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    // Initialize slider at current time in the default timezone (Asia/Kolkata)
    const [sliderPosition, setSliderPosition] = useState(() => {
        const nowInTz = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const hours = nowInTz.getHours();
        const minutes = nowInTz.getMinutes();
        return ((hours + minutes / 60) / 24) * 100;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStateLoaded, setIsStateLoaded] = useState(false);
    const timelineRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const lastMinuteRef = useRef(null);

    // Real-time updates
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Calculate time based on slider position
    const getTimeFromSliderPosition = (position) => {
        const hours = Math.floor((position / 100) * 24);
        const minutes = Math.floor(((position / 100) * 24 - hours) * 60);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // Helper: compute slider position for the current time in a timezone
    const getSliderPositionForNow = useCallback((timezone) => {
        const nowInTz = new Date(
            new Date().toLocaleString("en-US", { timeZone: timezone })
        );
        const hours = nowInTz.getHours();
        const minutes = nowInTz.getMinutes();
        return ((hours + minutes / 60) / 24) * 100;
    }, []);

    // Auto-follow: keep the draggable bar aligned to current time each minute.
    // Pauses while dragging; resumes on next minute tick.
    useEffect(() => {
        const localInTz = new Date(
            currentTime.toLocaleString("en-US", { timeZone: selectedTimezone })
        );
        const minuteKey = `${localInTz.getHours()}:${localInTz.getMinutes()}`;
        if (lastMinuteRef.current !== minuteKey) {
            lastMinuteRef.current = minuteKey;
            if (!isDragging) {
                setSliderPosition(getSliderPositionForNow(selectedTimezone));
            }
        }
    }, [currentTime, selectedTimezone, isDragging, getSliderPositionForNow]);

    // When timezone changes, align slider to current time in the newly selected timezone
    useEffect(() => {
        if (!isDragging) {
            setSliderPosition(getSliderPositionForNow(selectedTimezone));
        }
    }, [selectedTimezone, isDragging, getSliderPositionForNow]);

    // Get day/night icon based on time
    const getTimeIcon = (date, timezone) => {
        const localTime = new Date(
            date.toLocaleString("en-US", { timeZone: timezone })
        );
        const hour = localTime.getHours();

        // Day: 6 AM to 6 PM, Night: 6 PM to 6 AM
        if (hour >= 6 && hour < 18) {
            return <Sun size={16} className="text-yellow-400" />;
        } else {
            return <Moon size={16} className="text-blue-300" />;
        }
    };

    // Handle mouse events for slider
    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!isDragging || !timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(
                0,
                Math.min(100, (x / rect.width) * 100)
            );
            setSliderPosition(percentage);
        },
        [isDragging]
    );

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTimelineClick = (e) => {
        if (e.target.closest(".time-indicator-handle")) return;
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    // Add global mouse events when dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest(".timezone-dropdown")) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Load saved widget state on mount
    useEffect(() => {
        const loadSavedState = async () => {
            try {
                const savedState =
                    await widgetTabRetentionService.getWidgetState(
                        "MultiTimeAnalysis"
                    );
                if (savedState && Object.keys(savedState).length > 0) {
                    if (savedState.selectedTimezone)
                        setSelectedTimezone(savedState.selectedTimezone);
                    if (savedState.is24Hour !== undefined)
                        setIs24Hour(savedState.is24Hour);
                    if (savedState.sliderPosition !== undefined)
                        setSliderPosition(savedState.sliderPosition);
                }
            } catch (error) {
                console.error("Failed to load MultiTimeAnalysis state:", error);
            } finally {
                setIsStateLoaded(true);
            }
        };

        loadSavedState();
    }, []);

    // Debounced save function
    const debouncedSaveState = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (!isStateLoaded) return;

            try {
                const stateToSave = {
                    selectedTimezone,
                    is24Hour,
                    sliderPosition,
                };
                await widgetTabRetentionService.saveWidgetState(
                    "MultiTimeAnalysis",
                    stateToSave
                );
            } catch (error) {
                console.error("Failed to save MultiTimeAnalysis state:", error);
            }
        }, 1000);
    }, [selectedTimezone, is24Hour, sliderPosition, isStateLoaded]);

    // Auto-save state changes
    useEffect(() => {
        if (isStateLoaded) {
            debouncedSaveState();
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [
        selectedTimezone,
        is24Hour,
        sliderPosition,
        debouncedSaveState,
        isStateLoaded,
    ]);

    // Format time based on 12/24 hour toggle
    const formatTime = (date, timezone) => {
        const options = {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: !is24Hour,
        };
        return date.toLocaleTimeString("en-US", options);
    };

    // Format date based on timezone
    const formatDate = (date, timezone) => {
        const options = {
            timeZone: timezone,
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZoneName: "short",
        };
        return date.toLocaleDateString("en-US", options);
    };

    // Get market status based on real forex trading hours
    const getMarketStatus = (timezone) => {
        const now = new Date();
        const localTime = new Date(
            now.toLocaleString("en-US", { timeZone: timezone })
        );
        const day = localTime.getDay(); // 0 = Sunday, 6 = Saturday
        const hour = localTime.getHours();
        const minute = localTime.getMinutes();
        const timeInMinutes = hour * 60 + minute;

        // Forex markets are closed on weekends
        if (day === 0 || day === 6) {
            return "MARKET CLOSED FOR THE WEEKEND";
        }

        // Real forex trading hours (GMT times converted to local timezone)
        let marketOpen = false;
        let session = "";

        switch (timezone) {
            case "Australia/Sydney":
                // Sydney session: 22:00 GMT - 07:00 GMT (next day)
                // Convert to Sydney time: 09:00 - 18:00 (AEST/AEDT)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 18 * 60) {
                    marketOpen = true;
                    session = "SYDNEY SESSION";
                }
                break;

            case "Asia/Tokyo":
                // Tokyo session: 00:00 GMT - 09:00 GMT
                // Convert to Tokyo time: 09:00 - 18:00 (JST)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 18 * 60) {
                    marketOpen = true;
                    session = "TOKYO SESSION";
                }
                break;

            case "Asia/Hong_Kong":
                // Hong Kong session: 01:00 GMT - 09:00 GMT
                // Convert to Hong Kong time: 09:00 - 17:00 (HKT)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "HONG KONG SESSION";
                }
                break;

            case "Asia/Singapore":
                // Singapore session: 01:00 GMT - 09:00 GMT
                // Convert to Singapore time: 09:00 - 17:00 (SGT)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "SINGAPORE SESSION";
                }
                break;

            case "Asia/Dubai":
                // Dubai session: 05:00 GMT - 13:00 GMT
                // Convert to Dubai time: 09:00 - 17:00 (GST)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "DUBAI SESSION";
                }
                break;

            case "Asia/Kolkata":
                // Mumbai session: 03:30 GMT - 11:30 GMT
                // Convert to Mumbai time: 09:00 - 17:00 (IST)
                if (timeInMinutes >= 9 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "MUMBAI SESSION";
                }
                break;

            case "Europe/Berlin":
                // Frankfurt session: 07:00 GMT - 15:00 GMT
                // Convert to Frankfurt time: 08:00 - 16:00 (CET/CEST)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 16 * 60) {
                    marketOpen = true;
                    session = "FRANKFURT SESSION";
                }
                break;

            case "Europe/Zurich":
                // Zurich session: 07:00 GMT - 15:00 GMT
                // Convert to Zurich time: 08:00 - 16:00 (CET/CEST)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 16 * 60) {
                    marketOpen = true;
                    session = "ZURICH SESSION";
                }
                break;

            case "Europe/London":
                // London session: 08:00 GMT - 17:00 GMT
                // Convert to London time: 08:00 - 17:00 (GMT/BST)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "LONDON SESSION";
                }
                break;

            case "America/Toronto":
                // Toronto session: 13:00 GMT - 22:00 GMT
                // Convert to Toronto time: 08:00 - 17:00 (EST/EDT)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "TORONTO SESSION";
                }
                break;

            case "America/New_York":
                // New York session: 13:00 GMT - 22:00 GMT
                // Convert to New York time: 08:00 - 17:00 (EST/EDT)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "NEW YORK SESSION";
                }
                break;

            case "America/Los_Angeles":
                // Los Angeles session: 16:00 GMT - 01:00 GMT (next day)
                // Convert to Los Angeles time: 08:00 - 17:00 (PST/PDT)
                if (timeInMinutes >= 8 * 60 && timeInMinutes < 17 * 60) {
                    marketOpen = true;
                    session = "LOS ANGELES SESSION";
                }
                break;

            default:
                // Default to GMT-based calculation
                const gmtTime = new Date(
                    now.toLocaleString("en-US", { timeZone: "GMT" })
                );
                const gmtHour = gmtTime.getHours();
                if (gmtHour >= 8 && gmtHour < 17) {
                    marketOpen = true;
                    session = "MARKET OPEN";
                }
        }

        if (marketOpen) {
            return session;
        } else {
            return "MARKET CLOSED";
        }
    };

    // Get current trading session overlap information
    const getTradingOverlaps = () => {
        const now = new Date();
        const gmtTime = new Date(
            now.toLocaleString("en-US", { timeZone: "GMT" })
        );
        const gmtHour = gmtTime.getHours();
        const gmtMinute = gmtTime.getMinutes();
        const gmtTimeInMinutes = gmtHour * 60 + gmtMinute;

        const overlaps = [];

        // Asian-Pacific overlaps
        // Sydney-Tokyo overlap: 00:00-07:00 GMT
        if (gmtTimeInMinutes >= 0 && gmtTimeInMinutes < 7 * 60) {
            overlaps.push("Sydney-Tokyo Overlap");
        }

        // Tokyo-Hong Kong-Singapore overlap: 01:00-09:00 GMT
        if (gmtTimeInMinutes >= 1 * 60 && gmtTimeInMinutes < 9 * 60) {
            overlaps.push("Asian Markets Overlap");
        }

        // European overlaps
        // Frankfurt-Zurich-London overlap: 08:00-15:00 GMT
        if (gmtTimeInMinutes >= 8 * 60 && gmtTimeInMinutes < 15 * 60) {
            overlaps.push("European Markets Overlap");
        }

        // London-Tokyo overlap: 08:00-09:00 GMT
        if (gmtTimeInMinutes >= 8 * 60 && gmtTimeInMinutes < 9 * 60) {
            overlaps.push("London-Tokyo Overlap");
        }

        // London-New York overlap: 13:00-17:00 GMT (Highest volume)
        if (gmtTimeInMinutes >= 13 * 60 && gmtTimeInMinutes < 17 * 60) {
            overlaps.push("London-New York Overlap");
        }

        // American overlaps
        // Toronto-New York overlap: 13:00-17:00 GMT
        if (gmtTimeInMinutes >= 13 * 60 && gmtTimeInMinutes < 17 * 60) {
            overlaps.push("North American Overlap");
        }

        // New York-Los Angeles overlap: 16:00-22:00 GMT
        if (gmtTimeInMinutes >= 16 * 60 && gmtTimeInMinutes < 22 * 60) {
            overlaps.push("US Markets Overlap");
        }

        return overlaps;
    };

    // Timezone options with flags for dropdown
    const timezoneOptions = [
        { value: "Asia/Kolkata", label: "Mumbai", flag: "🇮🇳", gmt: "+5:30" },
        { value: "Asia/Dubai", label: "Dubai", flag: "🇦🇪", gmt: "+4" },
        { value: "Asia/Singapore", label: "Singapore", flag: "🇸🇬", gmt: "+8" },
        { value: "Asia/Hong_Kong", label: "Hong Kong", flag: "🇭🇰", gmt: "+8" },
        { value: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵", gmt: "+9" },
        { value: "Australia/Sydney", label: "Sydney", flag: "🇦🇺", gmt: "+10" },
        { value: "Europe/Zurich", label: "Zurich", flag: "🇨🇭", gmt: "+1" },
        { value: "Europe/Berlin", label: "Frankfurt", flag: "🇩🇪", gmt: "+1" },
        { value: "Europe/London", label: "London", flag: "🇬🇧", gmt: "+0" },
        { value: "America/Toronto", label: "Toronto", flag: "🇨🇦", gmt: "-5" },
        { value: "America/New_York", label: "New York", flag: "🇺🇸", gmt: "-5" },
        {
            value: "America/Los_Angeles",
            label: "Los Angeles",
            flag: "🇺🇸",
            gmt: "-8",
        },
    ];

    // (Removed legacy GMT conversion helper in favor of DST-aware local session conversion)

    // Helpers for converting local session times (market timezone) to Dates and to target timezone strings
    const getTodayYmdInTimezone = (timeZone) => {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(new Date());
        const y = parseInt(
            parts.find((p) => p.type === "year")?.value || "1970",
            10
        );
        const m =
            parseInt(parts.find((p) => p.type === "month")?.value || "01", 10) -
            1;
        const d = parseInt(
            parts.find((p) => p.type === "day")?.value || "01",
            10
        );
        return { y, m, d };
    };

    const parseHHMM = (hhmm) => {
        const [hStr, mStr] = hhmm.split(":");
        const h = parseInt(hStr, 10) || 0;
        const m = parseInt(mStr, 10) || 0;
        return { h, m };
    };

    // Returns a Date (UTC-based) that when formatted in timeZone shows the given y/m/d hh:mm
    const getDateForLocalTime = (timeZone, y, m, d, hh, mm) => {
        // Start with an approximate UTC date for the target local time
        const approx = new Date(Date.UTC(y, m, d, hh, mm));
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(approx);

        const curH = parseInt(
            parts.find((p) => p.type === "hour")?.value || "0",
            10
        );
        const curM = parseInt(
            parts.find((p) => p.type === "minute")?.value || "0",
            10
        );
        const diffMinutes = curH * 60 + curM - (hh * 60 + mm);
        return new Date(approx.getTime() - diffMinutes * 60 * 1000);
    };

    // Convert market local session hours (e.g. "08:00-17:00") to target timezone string respecting 12/24h
    const convertLocalSessionToTimezone = (
        sessionHours,
        sourceTz,
        targetTz
    ) => {
        try {
            const [startStr, endStr] = sessionHours.split("-");
            const { y, m, d } = getTodayYmdInTimezone(sourceTz);
            const { h: sh, m: sm } = parseHHMM(startStr);
            const { h: eh, m: em } = parseHHMM(endStr);

            const startUTC = getDateForLocalTime(sourceTz, y, m, d, sh, sm);
            let endUTC = getDateForLocalTime(sourceTz, y, m, d, eh, em);
            if (endUTC <= startUTC) {
                endUTC = new Date(endUTC.getTime() + 24 * 60 * 60 * 1000);
            }

            const fmt = (dt) =>
                dt.toLocaleTimeString("en-US", {
                    timeZone: targetTz,
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: !is24Hour,
                });
            return `${fmt(startUTC)}-${fmt(endUTC)}`;
        } catch (e) {
            return sessionHours;
        }
    };

    // Helper: get fractional hours for a Date in a specific timezone
    const getHourFractionInTimezone = (date, timeZone) => {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(date);
        const hh = parseInt(
            parts.find((p) => p.type === "hour")?.value || "0",
            10
        );
        const mm = parseInt(
            parts.find((p) => p.type === "minute")?.value || "0",
            10
        );
        return hh + mm / 60;
    };

    // Get session bar position and width based on LOCAL market hours (DST-aware), projected into selected timezone.
    // Bars remain a single element; cross-midnight remains one continuous segment (may extend beyond right edge visually).
    const getSessionBarStyleFromLocal = (sessionHours, sourceTz, targetTz) => {
        try {
            const [startStr, endStr] = sessionHours.split("-");
            const { y, m, d } = getTodayYmdInTimezone(sourceTz);
            const { h: sh, m: sm } = parseHHMM(startStr);
            const { h: eh, m: em } = parseHHMM(endStr);

            const startUTC = getDateForLocalTime(sourceTz, y, m, d, sh, sm);
            let endUTC = getDateForLocalTime(sourceTz, y, m, d, eh, em);
            if (endUTC <= startUTC) {
                endUTC = new Date(endUTC.getTime() + 24 * 60 * 60 * 1000);
            }

            const durationHours = (endUTC - startUTC) / (60 * 60 * 1000);
            const startHourLocal = getHourFractionInTimezone(
                startUTC,
                targetTz
            );

            const leftPercent = (startHourLocal / 24) * 100;
            const widthPercent = (durationHours / 24) * 100;

            return { left: `${leftPercent}%`, width: `${widthPercent}%` };
        } catch (e) {
            return { left: "0%", width: "0%" };
        }
    };

    const markets = [
        {
            name: "Sydney",
            flag: "🇦🇺",
            timezone: "Australia/Sydney",
            color: "bg-gradient-to-r from-blue-600 to-blue-800",
            stripedColor: "bg-gradient-to-r from-blue-700 to-blue-900",
            sessionHours: "09:00-18:00",
            gmtHours: "22:00-07:00 GMT",
        },
        {
            name: "London",
            flag: "🇬🇧",
            timezone: "Europe/London",
            color: "bg-gradient-to-r from-purple-600 to-purple-800",
            stripedColor: "bg-gradient-to-r from-purple-700 to-purple-900",
            sessionHours: "08:00-17:00",
            gmtHours: "08:00-17:00 GMT",
        },
        {
            name: "New York",
            flag: "🇺🇸",
            timezone: "America/New_York",
            color: "bg-gradient-to-r from-green-600 to-green-800",
            stripedColor: "bg-gradient-to-r from-green-700 to-green-900",
            sessionHours: "08:00-17:00",
            gmtHours: "13:00-22:00 GMT",
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-2 max-w-4xl mx-auto font-sans relative rounded-lg overflow-x-auto lg:overflow-x-hidden">
            {/* Time Format Toggle - Top Right */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    12h
                </span>
                <button
                    onClick={() => setIs24Hour(!is24Hour)}
                    className="flex items-center justify-center w-8 h-4 rounded-full transition-colors duration-200"
                    style={{
                        backgroundColor: is24Hour ? "#3b82f6" : "#d1d5db",
                    }}
                >
                    <div
                        className="w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200"
                        style={{
                            transform: is24Hour
                                ? "translateX(4px)"
                                : "translateX(-4px)",
                        }}
                    />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    24h
                </span>
            </div>

            {/* Header and Timezone Selector */}
            <div className="flex items-center justify-between mb-2 pr-14">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center tools-heading">
                        <Globe2 className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                        Forex Market Time Zone
                    </CardTitle>

                    <div className="relative timezone-dropdown">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-0.5 text-xs min-w-[130px] justify-between hover:bg-gray-50 dark:hover:bg-gray-600 whitespace-nowrap"
                        >
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <span className="text-sm">
                                    {
                                        timezoneOptions.find(
                                            (opt) =>
                                                opt.value === selectedTimezone
                                        )?.flag
                                    }
                                </span>
                                <span className="text-xs font-medium">
                                    {
                                        timezoneOptions.find(
                                            (opt) =>
                                                opt.value === selectedTimezone
                                        )?.label
                                    }
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    (GMT{" "}
                                    {
                                        timezoneOptions.find(
                                            (opt) =>
                                                opt.value === selectedTimezone
                                        )?.gmt
                                    }
                                    )
                                </span>
                            </div>
                            <svg
                                className={`w-3 h-3 transition-transform ${
                                    isDropdownOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                {timezoneOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSelectedTimezone(option.value);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap ${
                                            selectedTimezone === option.value
                                                ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                                                : "text-gray-900 dark:text-white"
                                        }`}
                                    >
                                        <span className="text-base">
                                            {option.flag}
                                        </span>
                                        <span className="flex-1 text-left text-xs font-medium">
                                            {option.label}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            GMT {option.gmt}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={timelineRef}
                className="relative timeline-container min-w-[700px] lg:min-w-0 cursor-pointer"
                onClick={handleTimelineClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleTimelineClick(e);
                    }
                }}
                role="presentation"
            >
                {/* Top hours - Real-time */}
                <div className="flex text-xs text-gray-500 dark:text-gray-400 justify-between px-4 mb-1.5">
                    {Array.from({ length: 24 }).map((_, i) => {
                        const hourTime = new Date();
                        hourTime.setHours(i, 0, 0, 0);
                        const displayHour = formatTime(
                            hourTime,
                            selectedTimezone
                        ).split(":")[0];

                        const nowInTz = new Date(
                            new Date().toLocaleString("en-US", {
                                timeZone: selectedTimezone,
                            })
                        );
                        const isCurrentHour = i === nowInTz.getHours();

                        return (
                            <span
                                key={i}
                                className={
                                    isCurrentHour
                                        ? "text-purple-600 font-bold"
                                        : ""
                                }
                            >
                                {displayHour}
                            </span>
                        );
                    })}
                </div>

                {/* Interactive Timeline Background */}
                <div
                    className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-4 mb-4 cursor-pointer relative"
                    role="slider"
                    tabIndex={0}
                    aria-label="Timeline slider"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={sliderPosition}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            const increment = e.key === "ArrowRight" ? 5 : -5;
                            setSliderPosition((prev) =>
                                Math.max(0, Math.min(100, prev + increment))
                            );
                        }
                    }}
                >
                    {/* Timeline markers */}
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-px h-2.5 bg-gray-300 dark:bg-gray-500 pointer-events-none"
                            style={{ left: `${(i / 23) * 100}%` }}
                        />
                    ))}
                </div>

                {/* Vertical Time Indicator Line */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-purple-500 pointer-events-none z-20"
                    style={{ left: `${sliderPosition}%` }}
                ></div>

                {/* Time Display - Draggable */}
                <div
                    className="time-indicator-handle absolute -top-[8px] flex flex-col items-center cursor-grab active:cursor-grabbing z-30"
                    style={{
                        left: `${sliderPosition}%`,
                        transform: "translateX(-50%)",
                    }}
                    onMouseDown={handleMouseDown}
                    role="slider"
                    tabIndex={0}
                    aria-label="Time indicator slider"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={sliderPosition}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            e.preventDefault();
                            const increment = e.key === "ArrowRight" ? 5 : -5;
                            setSliderPosition((prev) =>
                                Math.max(0, Math.min(100, prev + increment))
                            );
                        }
                    }}
                >
                    <div
                        className={`bg-purple-600 text-white px-2 py-0.5 rounded-lg shadow-md min-w-[90px] transition-transform ${
                            isDragging ? "scale-105" : "hover:scale-102"
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-1 text-xs font-medium whitespace-nowrap">
                                {getTimeIcon(
                                    getTimeFromSliderPosition(sliderPosition),
                                    selectedTimezone
                                )}
                                <span className="inline-flex">
                                    {formatTime(
                                        getTimeFromSliderPosition(
                                            sliderPosition
                                        ),
                                        selectedTimezone
                                    )}
                                </span>
                            </div>
                            <span className="text-[10px] text-center whitespace-nowrap">
                                {getTimeFromSliderPosition(
                                    sliderPosition
                                ).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    timeZone: selectedTimezone,
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Trading Overlaps */}
                <div className="mt-0.5 mb-1 min-w-[700px] lg:min-w-0">
                    <div className="flex items-center gap-0.5">
                        <h3 className="text-xs font-medium text-gray-800 dark:text-gray-200 tools-heading whitespace-nowrap">
                            Trading Overlaps:
                        </h3>
                        <div className="flex flex-nowrap gap-0.5 overflow-x-auto">
                            {getTradingOverlaps().length > 0 ? (
                                getTradingOverlaps().map((overlap, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                                    >
                                        {overlap}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                                    No active overlaps
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Market Rows */}
                <div className="space-y-0.5 mt-0.5 min-w-[800px] lg:min-w-0">
                    {markets.map((m, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-1.5 py-0.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                            {/* Flag + Info */}
                            <div className="flex items-center gap-1.5 w-52">
                                <span className="text-lg">{m.flag}</span>
                                <div>
                                    <h3 className="font-bold text-xs text-gray-900 dark:text-white">
                                        {m.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-800 dark:text-gray-200">
                                        {formatTime(currentTime, m.timezone)}
                                    </p>
                                    <p className="text-[10px] text-gray-800 dark:text-gray-200">
                                        {formatDate(currentTime, m.timezone)}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="text-xs text-gray-800 dark:text-gray-200 font-medium w-48">
                                <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${
                                        getMarketStatus(m.timezone).includes(
                                            "SESSION"
                                        )
                                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {getMarketStatus(m.timezone)}
                                </span>
                            </div>

                            {/* Timeline bar with session indicator */}
                            <div className="flex-1 ml-1 relative h-5">
                                <div
                                    className={`h-5 rounded-lg absolute overflow-hidden ${
                                        getMarketStatus(m.timezone).includes(
                                            "SESSION"
                                        )
                                            ? "opacity-100"
                                            : "opacity-30"
                                    }`}
                                    style={getSessionBarStyleFromLocal(
                                        m.sessionHours,
                                        m.timezone,
                                        selectedTimezone
                                    )}
                                >
                                    {/* Base gradient background */}
                                    <div
                                        className={`absolute inset-0 ${m.color}`}
                                    ></div>
                                    {/* Striped pattern overlay */}
                                    <div
                                        className="absolute inset-0 opacity-40"
                                        style={{
                                            backgroundImage: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        rgba(255,255,255,0.15) 3px,
                        rgba(255,255,255,0.15) 6px
                      )`,
                                        }}
                                    ></div>
                                    {/* Additional subtle stripe for depth */}
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{
                                            backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 6px,
                        rgba(0,0,0,0.1) 6px,
                        rgba(0,0,0,0.1) 12px
                      )`,
                                        }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-800 dark:text-gray-200 mt-6">
                                    {convertLocalSessionToTimezone(
                                        m.sessionHours,
                                        m.timezone,
                                        selectedTimezone
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ForexMarketTimeZone;
