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

  // Real-time updates
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

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && tzInputRef.current) {
      // Small timeout to ensure element is in DOM
      setTimeout(() => tzInputRef.current && tzInputRef.current.focus(), 0);
    }
  }, [isDropdownOpen]);

  // Load saved widget state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await widgetTabRetentionService.getWidgetState('MultiTimeAnalysis');
        if (savedState && Object.keys(savedState).length > 0) {
          if (savedState.selectedTimezone) setSelectedTimezone(savedState.selectedTimezone);
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
          sliderPosition
        };
        await widgetTabRetentionService.saveWidgetState('MultiTimeAnalysis', stateToSave);
      } catch (error) {
        console.error('Failed to save MultiTimeAnalysis state:', error);
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
  }, [selectedTimezone, is24Hour, sliderPosition, debouncedSaveState, isStateLoaded]);

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
    if (!result.viewer.retailGateOpen) return 'MARKET CLOSED FOR THE WEEKEND';
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

  // Convert GMT time to selected timezone (robust against locale parsing)
  const convertGMTToTimezone = (gmtHours, targetTimezone) => {
    const [startTime, endTime] = gmtHours.replace(' GMT', '').split('-');
    const [sh, sm = '0'] = startTime.split(':');
    const [eh, em = '0'] = endTime.split(':');
    const now = new Date();
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth();
    const d = now.getUTCDate();
    const startUTC = new Date(Date.UTC(y, mo, d, parseInt(sh, 10), parseInt(sm, 10), 0));
    const endUTC = new Date(Date.UTC(y, mo, d, parseInt(eh, 10), parseInt(em, 10), 0));
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const startInTz = fmt.format(startUTC);
    const endInTz = fmt.format(endUTC);
    return `${startInTz}-${endInTz}`;
  };

  // Get session bar position and width based on GMT hours, projected into the selected timezone
  const getSessionBarStyle = (gmtHours, targetTimezone) => {
    const [startTime, endTime] = gmtHours.replace(' GMT', '').split('-');
    const [sh, sm = '0'] = startTime.split(':');
    const [eh, em = '0'] = endTime.split(':');
    const now = new Date();
    const y = now.getUTCFullYear();
    const mo = now.getUTCMonth();
    const d = now.getUTCDate();
    const startUTC = new Date(Date.UTC(y, mo, d, parseInt(sh, 10), parseInt(sm, 10), 0));
    const endUTC = new Date(Date.UTC(y, mo, d, parseInt(eh, 10), parseInt(em, 10), 0));
    if (endUTC <= startUTC) {
      endUTC.setUTCDate(endUTC.getUTCDate() + 1);
    }

    const partsFor = (date) => new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(date);

    const decHour = (date) => {
      const parts = partsFor(date);
      const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      return h + m / 60;
    };

    const startLocal = decHour(startUTC);
    const endLocal = decHour(endUTC);

    let leftPercent;
    let widthPercent;
    if (endLocal >= startLocal) {
      leftPercent = (startLocal / 24) * 100;
      widthPercent = ((endLocal - startLocal) / 24) * 100;
    } else {
      // Crosses midnight in target timezone
      leftPercent = (startLocal / 24) * 100;
      widthPercent = ((24 - startLocal + endLocal) / 24) * 100;
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
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
                  {timezoneOptions.find(opt => opt.value === selectedTimezone)?.label}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  (GMT {timezoneOptions.find(opt => opt.value === selectedTimezone)?.gmt})
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
        {/* Top hours - Real-time (aligned after markets column) */}
        <div className="flex items-center px-6 mb-2">
          <div className="w-64"></div>
          <div className="flex-1 ml-2 flex text-xs text-gray-500 dark:text-gray-400 justify-between">
            {Array.from({ length: 24 }).map((_, i) => {
              const hourTime = new Date();
              hourTime.setHours(i, 0, 0, 0);
              const displayHour = formatTime(hourTime, selectedTimezone).split(':')[0];
              return (
                <span key={i} className={i === new Date().getHours() ? 'text-purple-600 font-bold' : ''}>
                  {displayHour}
                </span>
              );
            })}
          </div>
        </div>

        {/* Interactive Timeline Background */}
        <div className="flex items-center px-6 mb-2">
          <div className="w-64"></div>
          <div 
            ref={trackRef}
            className="flex-1 ml-2 h-3 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer relative"
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
            {/* Timeline markers */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-3 bg-gray-300 dark:bg-gray-500"
                style={{ left: `${(i / 23) * 100}%` }}
              />
            ))}
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

        {/* Market Rows */}
        <div className="space-y-1 mt-1 min-w-[800px] lg:min-w-0">
          {markets.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              {/* Flag + Info */}
              <div className="flex items-center gap-2 w-64">
                <span className="text-xl">{m.flag}</span>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</h3>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{formatTime(currentTime, m.timezone)}</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{formatDate(currentTime, m.timezone)}</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">{m.sessionHours}</p>
                </div>
              </div>

              {/* Status */}
              <div className="text-sm text-gray-800 dark:text-gray-200 font-medium w-64">
                <span className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                  getMarketStatus(m.timezone).includes('SESSION') 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {getMarketStatus(m.timezone)}
                </span>
              </div>

              {/* Timeline bar with session indicator */}
              <div className="flex-1 ml-2 relative h-6">
                <div 
                  className={`h-6 rounded-lg absolute overflow-hidden ${
                    getMarketStatus(m.timezone).includes('SESSION') ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={getSessionBarStyle(m.gmtHours, selectedTimezone)}
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
                </div>
                <p className="text-xs text-gray-800 dark:text-gray-200 mt-8">{convertGMTToTimezone(m.gmtHours, selectedTimezone)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ForexMarketTimeZone;
