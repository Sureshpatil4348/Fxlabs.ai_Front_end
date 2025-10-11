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

  // Real-time updates (every 10 seconds for better performance)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

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
    return `${hour12}:${minute} ${period}`;
  };

  // Format a range from ISO start/end
  const formatRangeFromISO = (startISO, endISO) => {
    return `${formatTimeFromISO(startISO)}-${formatTimeFromISO(endISO)}`;
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
  <div className="bg-white dark:bg-gray-800 p-3 max-w-4xl mx-auto font-sans relative rounded-xl shadow-none dark:shadow-none overflow-x-auto lg:overflow-x-hidden border-0">
      {/* Time Format Toggle - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
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

      {/* Header and Timezone Selector */}
      <div className="flex items-center justify-between mb-3 pr-16">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center tools-heading">
            <Globe2 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Forex Market Time Zone Converter
          </CardTitle>
          
          <div className="relative timezone-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1 text-xs min-w-[150px] justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-xs font-medium">
                  {currentTimezoneOption.label}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  (GMT {currentTimezoneOption.gmt})
                </span>
              </div>
              <svg 
                className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-1 sticky top-0 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <input
                    ref={tzInputRef}
                    type="text"
                    value={tzQuery}
                    onChange={(e) => setTzQuery(e.target.value)}
                    placeholder="Search timezone..."
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
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
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap ${
                      selectedTimezone === option.value 
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                        : 'text-gray-900 dark:text-white'
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
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative timeline-container min-w-[700px] lg:min-w-0" onMouseMove={handleMouseMove}>
        {/* Top hours - Real-time (aligned after market info column) - Clickable to move time indicator */}
        <div className="flex items-center px-6 mb-2">
          <div className="w-48"></div> {/* Spacer for market info column */}
          <div 
            ref={trackRef}
            className="flex-1 ml-2 flex text-xs text-gray-500 dark:text-gray-400 justify-between cursor-pointer"
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
          <div className="flex items-center px-6 mt-3 mb-2">
            <div className="w-48"></div> {/* Spacer for market info column */}
            <div className="flex-1 ml-2">
              <p className="text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 py-1 px-3 rounded">
                MARKET CLOSED FOR THE WEEKEND
              </p>
            </div>
          </div>
        )}

        {/* Market Rows */}
        <div className="space-y-4 mt-4 min-w-[800px] lg:min-w-0">
          {markets.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Currency + Info */}
              <div className="flex items-center gap-3 w-48">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  <span className="text-gray-700 dark:text-gray-300 text-xs font-bold">{m.currency}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</h3>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{formatTime(currentTime, m.timezone)}</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{formatDate(currentTime, m.timezone)}</p>
                </div>
              </div>

              {/* Status removed to reclaim space */}
              <div className="hidden"></div>

              {/* Timeline bar with session indicator(s) */}
              <div className="flex-1 ml-2 relative h-10 overflow-hidden">
                {(() => {
                  const segments = getSessionSegments(m.timezone);
                  // Find the largest segment by width
                  let largestSegmentIdx = 0;
                  let maxWidth = 0;
                  segments.forEach((seg, idx) => {
                    const style = getBarStyleFromISO(seg.startLocalISO, seg.endLocalISO);
                    const width = parseFloat(style.width);
                    if (width > maxWidth) {
                      maxWidth = width;
                      largestSegmentIdx = idx;
                    }
                  });
                  
                  return segments.map((seg, idx) => (
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
                      {/* Timing text inside bar - only show in largest segment */}
                      {idx === largestSegmentIdx && (
                        <span className="relative z-10 text-xs font-medium text-white drop-shadow-md">
                          {formatRangeFromISO(seg.startLocalISO, seg.endLocalISO)}
                        </span>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ForexMarketTimeZone;
