import { Sun, Moon, Globe2 } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";

import widgetTabRetentionService from '../services/widgetTabRetentionService';
import { computeMarketHours, listTimezonesWithOffsets } from '../utils/marketHoursEngine';
import { CardTitle } from './ui/card';

const ForexMarketTimeZone = () => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [selectedTimezone, setSelectedTimezone] = useState(systemTimezone);
  const [is24Hour, setIs24Hour] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Initialize slider at current time in the default timezone (browser/system)
  const [sliderPosition, setSliderPosition] = useState(() => {
    // Use Intl.DateTimeFormat parts to avoid string parsing and rounding errors
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: systemTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(new Date());
    const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const s = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
    return ((h + (m + s / 60) / 60) / 24) * 100;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tzQuery, setTzQuery] = useState('');
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const timelineRef = useRef(null);
  const trackRef = useRef(null);
  const tzInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastMinuteRef = useRef(null);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const scrollContainerRef = useRef(null);

  // Real-time updates (every 1 second for accurate time display)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time based on slider position
  const getTimeFromSliderPosition = (position) => {
    const totalHours = (position / 100) * 24;
    let hours = Math.floor(totalHours + 1e-9);
    let minutes = Math.round((totalHours - hours) * 60);
    if (minutes === 60) {
      minutes = 0;
      hours = (hours + 1) % 24;
    }
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Helper: compute slider position for the current time in a timezone (precise to seconds)
  const getSliderPositionForNow = useCallback((timezone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(new Date());
    const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const s = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
    return ((h + (m + s / 60) / 60) / 24) * 100;
  }, []);

  // Auto-follow: keep the draggable bar aligned to current time each minute.
  // Pauses while dragging; resumes on next minute tick.
  useEffect(() => {
    // Compute HH:MM in the selected timezone reliably using Intl parts
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: selectedTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(currentTime);
    const h = parts.find(p => p.type === 'hour')?.value || '00';
    const m = parts.find(p => p.type === 'minute')?.value || '00';
    const minuteKey = `${h}:${m}`;
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
    const localTime = new Date(date.toLocaleString("en-US", {timeZone: timezone}));
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
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !timelineRef.current) return;
    const basis = trackRef.current || timelineRef.current;
    const rect = basis.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.timezone-dropdown')) {
        setIsDropdownOpen(false);
        setTzQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Keep indicator horizontally aligned with the track left + slider position
  const updateIndicatorLeft = useCallback(() => {
    if (!timelineRef.current || !trackRef.current) return;
    const containerRect = timelineRef.current.getBoundingClientRect();
    const trackRect = trackRef.current.getBoundingClientRect();
    const leftPx = (trackRect.left - containerRect.left) + (sliderPosition / 100) * trackRect.width;
    setIndicatorLeft(leftPx);
  }, [sliderPosition]);

  useEffect(() => {
    updateIndicatorLeft();
  }, [sliderPosition, selectedTimezone, updateIndicatorLeft]);

  useEffect(() => {
    const onResize = () => updateIndicatorLeft();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateIndicatorLeft]);

  // Auto-scroll to current time indicator on mount and when indicator position changes (mobile only)
  useEffect(() => {
    if (!scrollContainerRef.current || !trackRef.current) return;
    
    // Only apply on mobile (screen width < 1024px)
    if (window.innerWidth >= 1024) return;
    
    const scrollContainer = scrollContainerRef.current;
    const containerWidth = scrollContainer.clientWidth;
    const scrollWidth = scrollContainer.scrollWidth;
    
    // Calculate scroll position to center the indicator
    const indicatorPositionInScroll = (sliderPosition / 100) * scrollWidth;
    const scrollLeft = indicatorPositionInScroll - (containerWidth / 2);
    
    // Smooth scroll to position
    scrollContainer.scrollTo({
      left: Math.max(0, scrollLeft),
      behavior: 'smooth'
    });
  }, [indicatorLeft, sliderPosition]);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && tzInputRef.current) {
      // Small timeout to ensure element is in DOM
      setTimeout(() => tzInputRef.current && tzInputRef.current.focus(), 0);
    }
  }, [isDropdownOpen]);

  // Load saved widget state on mount
  // Note: Timezone is NOT saved/restored - always defaults to browser/device timezone
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await widgetTabRetentionService.getWidgetState('MultiTimeAnalysis');
        if (savedState && Object.keys(savedState).length > 0) {
          // selectedTimezone is intentionally not restored - always use browser timezone
          if (savedState.is24Hour !== undefined) setIs24Hour(savedState.is24Hour);
          if (savedState.sliderPosition !== undefined) setSliderPosition(savedState.sliderPosition);
        }
      } catch (error) {
        console.error('Failed to load MultiTimeAnalysis state:', error);
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadSavedState();
  }, []);

  // Debounced save function
  // Note: Timezone is NOT saved - only user preferences like 24-hour format and slider position
  const debouncedSaveState = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!isStateLoaded) return;
      
      try {
        const stateToSave = {
          // selectedTimezone is intentionally excluded - always use browser timezone
          is24Hour,
          sliderPosition
        };
        await widgetTabRetentionService.saveWidgetState('MultiTimeAnalysis', stateToSave);
      } catch (error) {
        console.error('Failed to save MultiTimeAnalysis state:', error);
      }
    }, 1000);
  }, [is24Hour, sliderPosition, isStateLoaded]);

  // Auto-save state changes (excluding timezone which always defaults to browser)
  useEffect(() => {
    if (isStateLoaded) {
      debouncedSaveState();
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [is24Hour, sliderPosition, debouncedSaveState, isStateLoaded]);

  // Format time based on 12/24 hour toggle
  const formatTime = (date, timezone) => {
    const options = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24Hour
    };
    return date.toLocaleTimeString('en-US', options);
  };

  // Format date based on timezone
  const formatDate = (date, timezone) => {
    const options = {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZoneName: 'short'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Get market status using the DST-aware engine
  const getMarketStatus = (timezone) => {
    const result = computeMarketHours({ viewInstantUTC: new Date(), viewerTz: selectedTimezone });
    const map = new Map(result.sessions.map(s => [s.cityTzLabel, s.isOpenNow]));
    const open = map.get(timezone);
    if (result.viewer.retailGateOpen && open) {
      if (timezone === 'Australia/Sydney') return 'SYDNEY SESSION';
      if (timezone === 'Europe/London') return 'LONDON SESSION';
      if (timezone === 'America/New_York') return 'NEW YORK SESSION';
    }
    return 'MARKET CLOSED';
  };

  // Overlap UI removed; no overlap calculations needed here


  // Timezone options generated dynamically with current GMT offsets
  const timezoneOptions = React.useMemo(() => listTimezonesWithOffsets(new Date()).map(item => ({
    value: item.value,
    label: item.label,
    flag: item.flag,
    gmt: item.gmt
  })), []);

  // Get currently selected timezone option with fallback
  const currentTimezoneOption = React.useMemo(() => {
    const found = timezoneOptions.find(opt => opt.value === selectedTimezone);
    if (found) return found;
    // Fallback: if not found, use first option (shouldn't happen with the fix above)
    return timezoneOptions[0] || { label: 'UTC', gmt: '+00:00', value: 'UTC' };
  }, [timezoneOptions, selectedTimezone]);

  // Filter timezones by query across label, zone id, and offset
  const filteredTimezones = React.useMemo(() => {
    const q = tzQuery.trim().toLowerCase();
    if (!q) return timezoneOptions;
    return timezoneOptions.filter((opt) => {
      const id = String(opt.value || '').toLowerCase();
      const label = String(opt.label || '').toLowerCase();
      const gmt = String(opt.gmt || '').toLowerCase();
      return id.includes(q) || label.includes(q) || gmt.includes(q);
    });
  }, [tzQuery, timezoneOptions]);

  // Get DST-aware market data for all sessions
  // Memoized to update only when timezone changes or minute changes (not every second)
  const currentMinute = React.useMemo(() => {
    const d = new Date(currentTime);
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}`;
  }, [currentTime]);

  const marketData = React.useMemo(() => {
    return computeMarketHours({ viewInstantUTC: currentTime, viewerTz: selectedTimezone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMinute, selectedTimezone]);

  // Compute bar style from a projected segment's start/end ISO strings (in viewer timezone)
  const getBarStyleFromISO = (startLocalISO, endLocalISO) => {
    // Parse ISO time strings to extract hours and minutes
    const parseTime = (isoString) => {
      const timePart = isoString.split('T')[1];
      const [h, m] = timePart.split(':').map(Number);
      return h + m / 60;
    };

    const startHour = parseTime(startLocalISO);
    const endHour = parseTime(endLocalISO);

    // Handle sessions that cross midnight (endHour < startHour)
    let adjustedEndHour = endHour;
    if (endHour < startHour) {
      adjustedEndHour = endHour + 24;
    }

    // Calculate bar position relative to the 24-hour timeline
    const leftPercentRaw = (startHour / 24) * 100;
    const widthPercentRaw = ((adjustedEndHour - startHour) / 24) * 100;

    const leftPercent = Math.max(0, Math.min(100, leftPercentRaw));
    let widthPercent = widthPercentRaw;
    if (leftPercent + widthPercent > 100) {
      widthPercent = 100 - leftPercent;
    }

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(0, widthPercent)}%`
    };
  };

  // Get all projected segments for a given market timezone
  const getSessionSegments = (marketTimezone) => {
    const session = marketData.sessions.find(s => s.cityTzLabel === marketTimezone);
    if (!session) return [];
    if (Array.isArray(session.projectedSegmentsInViewer)) return session.projectedSegmentsInViewer;
    if (session.projectedSegmentInViewer) return [session.projectedSegmentInViewer];
    return [];
  };

  // Format a time from ISO based on 12h/24h preference
  const formatTimeFromISO = (isoString) => {
    const timePart = isoString.split('T')[1];
    const [h, m] = timePart.split(':');
    const hour = parseInt(h, 10);
    const minute = m;
    if (is24Hour) {
      return `${h}:${minute}`;
    }
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    // Removed space before AM/PM as requested
    return `${hour12}:${minute}${period}`;
  };

  // Format a range from ISO start/end
  const formatRangeFromISO = (startISO, endISO) => {
    return `${formatTimeFromISO(startISO)}-${formatTimeFromISO(endISO)}`;
  };

  // Helpers to detect midnight boundaries for split segments
  const getHourMinuteFromISO = (isoString) => {
    const timePart = isoString.split('T')[1];
    const [h, m] = timePart.split(':');
    return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
  };

  const isMidnightLocal = (isoString) => {
    const { hour, minute } = getHourMinuteFromISO(isoString);
    return hour === 0 && minute === 0;
  };

  // Determine label for a segment under split logic:
  // - Single segment: start-end
  // - Split segments:
  //   - Segment starting at midnight (00:00): show end time (closing part)
  //   - Segment ending at midnight (00:00): show start time (opening part)
  //   - Fallback: first => end time, last => start time
  const labelForSegment = (segments, idx) => {
    if (!Array.isArray(segments) || segments.length === 0) return null;
    const seg = segments[idx];
    if (segments.length === 1) {
      return formatRangeFromISO(seg.startLocalISO, seg.endLocalISO);
    }
    const startIsMidnight = isMidnightLocal(seg.startLocalISO);
    const endIsMidnight = isMidnightLocal(seg.endLocalISO);
    if (startIsMidnight && !endIsMidnight) return formatTimeFromISO(seg.endLocalISO);
    if (!startIsMidnight && endIsMidnight) return formatTimeFromISO(seg.startLocalISO);
    // Fallback if neither boundary is exactly midnight
    const isFirst = idx === 0;
    const isLast = idx === segments.length - 1;
    if (isFirst) return formatTimeFromISO(seg.endLocalISO);
    if (isLast) return formatTimeFromISO(seg.startLocalISO);
    return null;
  };

  const markets = [
    {
      name: "Sydney",
      currency: "AUD",
      timezone: "Australia/Sydney",
      color: "bg-gradient-to-r from-blue-700 to-blue-900",
      stripedColor: "bg-gradient-to-r from-blue-800 to-blue-950",
    },
    {
      name: "London",
      currency: "GBP",
      timezone: "Europe/London",
      color: "bg-gradient-to-r from-purple-700 to-purple-900",
      stripedColor: "bg-gradient-to-r from-purple-800 to-purple-950",
    },
    {
      name: "New York",
      currency: "USD",
      timezone: "America/New_York",
      color: "bg-gradient-to-r from-green-700 to-green-900",
      stripedColor: "bg-gradient-to-r from-green-800 to-green-950",
    },
  ];

  return (
  <div className="bg-white dark:bg-[#19235d] p-2 sm:p-3 max-w-4xl mx-auto font-sans relative rounded-xl shadow-none dark:shadow-none border-0">
      {/* Time Format Toggle - Top Right */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2 z-50">
        <span className="text-xs text-gray-500 dark:text-gray-400">12h</span>
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="flex items-center justify-center w-8 h-4 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: is24Hour ? '#3b82f6' : '#d1d5db'
          }}
        >
          <div 
            className="w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200"
            style={{
              transform: is24Hour ? 'translateX(4px)' : 'translateX(-4px)'
            }}
          />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">24h</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 pr-14 sm:pr-16">
        <CardTitle className="text-lg font-bold text-[#19235d] dark:text-white flex items-start tools-heading">
          <Globe2 className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600" />
          Forex Market Time Zone Converter
        </CardTitle>
      </div>

      {/* Timeline - Mobile: Fixed markets + Scrollable timeline */}
      <div className="lg:block overflow-visible">
        {/* Mobile: Flex container with fixed markets column */}
        <div className="flex lg:block overflow-visible">
          {/* Left column: Markets info (Fixed on mobile) */}
          <div className="flex-shrink-0 w-48 lg:hidden overflow-visible pt-6">
            {/* Timezone Selector - Mobile */}
            <div className="mb-1 sm:mb-2 px-2 h-10">
              <div className="relative timezone-dropdown">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-white rounded-lg px-2 py-1 text-xs w-full justify-between hover:bg-gray-50 dark:hover:bg-[#19235d] transition-colors"
                >
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] font-medium truncate w-full text-left">
                      {currentTimezoneOption.label}
                    </span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                      GMT {currentTimezoneOption.gmt}
                    </span>
                  </div>
                  <svg 
                    className={`w-3 h-3 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#19235d] border border-gray-300 dark:border-[#19235d] rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                    <div className="p-1 sticky top-0 bg-white dark:bg-[#19235d] border-b border-gray-200 dark:border-[#19235d]">
                      <input
                        ref={tzInputRef}
                        type="text"
                        value={tzQuery}
                        onChange={(e) => setTzQuery(e.target.value)}
                        placeholder="Search timezone..."
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-white outline-none"
                      />
                    </div>
                    {filteredTimezones.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedTimezone(option.value);
                          setIsDropdownOpen(false);
                          setTzQuery('');
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-[#19235d] transition-colors whitespace-nowrap ${
                          selectedTimezone === option.value 
                            ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                            : 'text-[#19235d] dark:text-white'
                        }`}
                      >
                        <span className="flex-1 text-left text-xs font-medium">{option.label}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">GMT {option.gmt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Weekend closure spacer - matches the message height on right side */}
            {!marketData.viewer.retailGateOpen && (
              <div className="mt-2 sm:mt-3 mb-1 sm:mb-2 px-2">
                {/* Empty spacer to match weekend message height */}
                <div className="h-[26px]"></div>
              </div>
            )}
            
            {/* Market info cards */}
            <div className="space-y-4 mt-2 sm:mt-4 px-2">
              {markets.map((m, i) => (
                <div
                  key={i}
                  className="px-2 py-2 bg-white dark:bg-[#19235d] border border-gray-200 dark:border-[#19235d] rounded-xl shadow-sm h-[60px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d]">
                      <span className="text-[#19235d] dark:text-gray-300 text-[10px] font-bold">{m.currency}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-[#19235d] dark:text-white truncate">{m.name}</h3>
                      <p className="text-[10px] text-[#19235d] dark:text-gray-200 leading-tight">{formatTime(currentTime, m.timezone)}</p>
                      <p className="text-[10px] text-[#19235d] dark:text-gray-200 leading-tight truncate">{formatDate(currentTime, m.timezone)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Scrollable timeline (Mobile) / Full width (Desktop) */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-visible lg:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-[#19235d] dark:scrollbar-track-[#19235d] pt-6 lg:pt-0"
          >
            <div ref={timelineRef} className="relative timeline-container min-w-[700px] lg:min-w-0" onMouseMove={handleMouseMove}>
              {/* Top hours - Real-time - Clickable to move time indicator */}
              <div className="flex items-start mb-1 sm:mb-2 px-2 lg:px-0 h-10 lg:h-auto">
                {/* Timezone Selector - Desktop */}
                <div className="w-48 lg:w-56 hidden lg:block lg:ml-0">
                  <div className="relative timezone-dropdown">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-1.5 border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-white rounded-lg px-2 py-1 text-xs w-full justify-between hover:bg-gray-50 dark:hover:bg-[#19235d] transition-colors"
                    >
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] font-medium truncate w-full text-left">
                          {currentTimezoneOption.label}
                        </span>
                        <span className="text-[9px] text-gray-500 dark:text-gray-400">
                          GMT {currentTimezoneOption.gmt}
                        </span>
                      </div>
                      <svg 
                        className={`w-3 h-3 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#19235d] border border-gray-300 dark:border-[#19235d] rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
                        <div className="p-1 sticky top-0 bg-white dark:bg-[#19235d] border-b border-gray-200 dark:border-[#19235d]">
                          <input
                            ref={tzInputRef}
                            type="text"
                            value={tzQuery}
                            onChange={(e) => setTzQuery(e.target.value)}
                            placeholder="Search timezone..."
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d] text-[#19235d] dark:text-white outline-none"
                          />
                        </div>
                        {filteredTimezones.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedTimezone(option.value);
                              setIsDropdownOpen(false);
                              setTzQuery('');
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-[#19235d] transition-colors whitespace-nowrap ${
                              selectedTimezone === option.value 
                                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                                : 'text-[#19235d] dark:text-white'
                            }`}
                          >
                            <span className="flex-1 text-left text-xs font-medium">{option.label}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">GMT {option.gmt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div 
                  ref={trackRef}
                  className="flex-1 lg:ml-2 flex text-xs text-gray-500 dark:text-gray-400 justify-between cursor-pointer h-full items-center"
                  role="slider"
                  tabIndex={0}
                  aria-label="Timeline slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={sliderPosition}
                  onClick={(e) => {
                    const rect = (trackRef.current || e.currentTarget).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    setSliderPosition(percentage);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      const increment = e.key === 'ArrowRight' ? 5 : -5;
                      setSliderPosition(prev => Math.max(0, Math.min(100, prev + increment)));
                    }
                  }}
                >
                  {Array.from({ length: 25 }).map((_, i) => {
                    const hourIndex = i === 24 ? 24 : i; // include terminal label
                    let displayHour;
                    if (is24Hour) {
                      // 24-hour format: 0-24 (show 24 at the end)
                      displayHour = hourIndex;
                    } else {
                      // 12-hour format: 12, 1-11, 12, 1-11, 12 (show 12 at the end)
                      if (hourIndex === 24) {
                        displayHour = 12;
                      } else {
                        displayHour = hourIndex === 0 ? 12 : hourIndex > 12 ? hourIndex - 12 : hourIndex;
                      }
                    }
                    return (
                      <span 
                        key={i} 
                        className={`hover:text-purple-500 transition-colors ${i === new Date().getHours() ? 'text-purple-600 font-bold' : ''}`}
                      >
                        {displayHour}
                      </span>
                    );
                  })}
                </div>
              </div>

        {/* Vertical Time Indicator - Interactive Slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-purple-500 cursor-grab active:cursor-grabbing transition-all duration-200"
          style={{ left: `${indicatorLeft}px` }}
          role="slider"
          tabIndex={0}
          aria-label="Time indicator slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPosition}
          onMouseDown={handleMouseDown}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              const increment = e.key === 'ArrowRight' ? 5 : -5;
              setSliderPosition(prev => Math.max(0, Math.min(100, prev + increment)));
            }
          }}
        >
          {/* Slider Handle */}
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-purple-600 rounded-full border-2 border-white shadow-lg"></div>
        </div>
        
        {/* Time Display */}
        <div 
          className="absolute -top-[10px] flex flex-col items-center cursor-grab active:cursor-grabbing z-10"
          style={{ left: `${indicatorLeft}px`, transform: 'translateX(-50%)' }}
          role="slider"
          tabIndex={0}
          aria-label="Time indicator slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPosition}
          onMouseDown={handleMouseDown}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              const increment = e.key === 'ArrowRight' ? 5 : -5;
              setSliderPosition(prev => Math.max(0, Math.min(100, prev + increment)));
            }
          }}
        >
          <div className="bg-purple-600 text-white px-2 py-1 rounded-lg shadow-lg min-w-[100px]">
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="flex items-center justify-center gap-1 text-sm font-medium whitespace-nowrap">
                {getTimeIcon(getTimeFromSliderPosition(sliderPosition), selectedTimezone)}
                <span className="inline-flex">{formatTime(getTimeFromSliderPosition(sliderPosition), selectedTimezone)}</span>
              </div>
              <span className="text-xs text-center whitespace-nowrap">{getTimeFromSliderPosition(sliderPosition).toLocaleDateString('en-US', { weekday: 'long', timeZone: selectedTimezone })}</span>
            </div>
          </div>
        </div>

        {/* Overlaps removed per requirement */}

              {/* Global Weekend Closure Message */}
              {!marketData.viewer.retailGateOpen && (
                <div className="mt-2 sm:mt-3 lg:mt-1 mb-1 sm:mb-2">
                  <div className="hidden lg:flex items-center mx-3 sm:mx-4 lg:mx-0">
                    <div className="w-48 lg:w-56"></div> {/* Spacer for desktop */}
                    <div className="flex-1 ml-2">
                      <p className="text-xs text-center text-[#19235d] dark:text-gray-400 bg-gray-100 dark:bg-[#19235d] py-1 px-3 rounded">
                        MARKET CLOSED FOR THE WEEKEND
                      </p>
                    </div>
                  </div>
                  {/* Mobile version */}
                  <div className="lg:hidden px-2">
                    <p className="text-xs text-center text-[#19235d] dark:text-gray-400 bg-gray-100 dark:bg-[#19235d] py-1 px-3 rounded">
                      MARKET CLOSED FOR THE WEEKEND
                    </p>
                  </div>
                </div>
              )}

              {/* Market Rows - Desktop layout (hidden on mobile) */}
              <div className="hidden lg:block space-y-4 mt-2 sm:mt-4 mx-3 sm:mx-4 lg:mx-0">
                {markets.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 sm:gap-3 py-2 bg-white dark:bg-[#19235d] border border-gray-200 dark:border-[#19235d] rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Currency + Info */}
                    <div className="flex items-center gap-3 w-48 lg:w-56 flex-shrink-0 px-3 sm:px-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-[#19235d] bg-white dark:bg-[#19235d]">
                        <span className="text-[#19235d] dark:text-gray-300 text-xs font-bold">{m.currency}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#19235d] dark:text-white">{m.name}</h3>
                        <p className="text-xs text-[#19235d] dark:text-gray-200">{formatTime(currentTime, m.timezone)}</p>
                        <p className="text-xs text-[#19235d] dark:text-gray-200">{formatDate(currentTime, m.timezone)}</p>
                      </div>
                    </div>

                    {/* Timeline bar with session indicator(s) */}
                    <div className="flex-1 ml-2 relative h-10 overflow-hidden pr-3 sm:pr-4">
                {(() => {
                  const segments = getSessionSegments(m.timezone);
                  return segments.map((seg, idx) => {
                    const label = labelForSegment(segments, idx);
                    return (
                      <div 
                        key={idx}
                        className={`h-10 rounded-lg absolute overflow-hidden flex items-center justify-center ${
                          getMarketStatus(m.timezone).includes('SESSION') ? 'opacity-100' : 'opacity-60'
                        }`}
                        style={getBarStyleFromISO(seg.startLocalISO, seg.endLocalISO)}
                      >
                        {/* Base gradient background */}
                        <div className={`absolute inset-0 ${m.color}`}></div>
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
                            )`
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
                            )`
                          }}
                        ></div>
                        {/* Timing text logic: single shows start-end; split shows start on opening part, end on closing part */}
                        {label && (
                          <span className="relative z-10 text-xs font-medium text-white drop-shadow-md">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Rows - Mobile layout (timeline bars only, markets are in fixed left column) */}
              <div className="lg:hidden space-y-4 mt-2 sm:mt-4 px-2">
                {markets.map((m, i) => (
                  <div
                    key={i}
                    className="px-3 bg-white dark:bg-[#19235d] border border-gray-200 dark:border-[#19235d] rounded-xl shadow-sm h-[60px] flex items-center"
                  >
                    {/* Timeline bar with session indicator(s) */}
                    <div className="relative h-10 overflow-hidden w-full">
                      {(() => {
                        const segments = getSessionSegments(m.timezone);
                        return segments.map((seg, idx) => {
                          const label = labelForSegment(segments, idx);
                          return (
                            <div 
                              key={idx}
                              className={`h-10 rounded-lg absolute overflow-hidden flex items-center justify-center ${
                                getMarketStatus(m.timezone).includes('SESSION') ? 'opacity-100' : 'opacity-60'
                              }`}
                              style={getBarStyleFromISO(seg.startLocalISO, seg.endLocalISO)}
                            >
                              {/* Base gradient background */}
                              <div className={`absolute inset-0 ${m.color}`}></div>
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
                                  )`
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
                                  )`
                                }}
                              ></div>
                              {/* Timing text logic: single shows start-end; split shows start on opening part, end on closing part */}
                              {label && (
                                <span className="relative z-10 text-xs font-medium text-white drop-shadow-md">
                                  {label}
                                </span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForexMarketTimeZone;
