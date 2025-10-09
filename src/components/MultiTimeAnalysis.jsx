import { Sun, Moon, Globe2 } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";

const ForexMarketTimeZone = () => {
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Kolkata");
  const [is24Hour, setIs24Hour] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sliderPosition, setSliderPosition] = useState(66.67); // Default position (2/3 of timeline)
  const [isDragging, setIsDragging] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const timelineRef = useRef(null);

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
    
    const rect = timelineRef.current.getBoundingClientRect();
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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

  // Get market status based on real forex trading hours
  const getMarketStatus = (timezone) => {
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
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
        const gmtTime = new Date(now.toLocaleString("en-US", {timeZone: "GMT"}));
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
    const gmtTime = new Date(now.toLocaleString("en-US", {timeZone: "GMT"}));
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
    { value: "America/Los_Angeles", label: "Los Angeles", flag: "🇺🇸", gmt: "-8" },
  ];

  // Get session bar position and width based on GMT hours (constrains cross-midnight to end of day)
  const getSessionBarStyle = (gmtHours) => {
    const timeRange = gmtHours.replace(' GMT', '').split('-');
    let startHour = parseInt(timeRange[0].split(':')[0]);
    let endHour = parseInt(timeRange[1].split(':')[0]);

    if (isNaN(startHour) || isNaN(endHour)) return { left: '0%', width: '0%' };

    // If session crosses midnight, only show from start to 24:00 within current day
    if (endHour < startHour) {
      const startPercent = (startHour / 24) * 100;
      const widthPercent = ((24 - startHour) / 24) * 100;
      return {
        left: `${startPercent}%`,
        width: `${widthPercent}%`
      };
    }

    const duration = endHour - startHour;
    const startPercent = (startHour / 24) * 100;
    const widthPercent = (duration / 24) * 100;
    return {
      left: `${startPercent}%`,
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
          <h1 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 tools-heading">
            <Globe2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold">Forex Market Time Zone Converter</span>
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">|</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">TIMEZONE</span>
          <div className="relative timezone-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-1 text-xs min-w-[160px] justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {timezoneOptions.find(opt => opt.value === selectedTimezone)?.flag}
                </span>
                <span className="text-xs">
                  {timezoneOptions.find(opt => opt.value === selectedTimezone)?.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
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
                {timezoneOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedTimezone(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      selectedTimezone === option.value 
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <span className="text-lg">{option.flag}</span>
                    <span className="flex-1 text-left">{option.label}</span>
                    <span className="text-gray-500 dark:text-gray-400">GMT {option.gmt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative timeline-container min-w-[700px] lg:min-w-0" onMouseMove={handleMouseMove}>
        {/* Top hours - Real-time */}
        <div className="flex text-xs text-gray-500 dark:text-gray-400 justify-between px-6 mb-2">
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

        {/* Interactive Timeline Background */}
        <div 
          className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full mx-6 mb-6 cursor-pointer"
          role="slider"
          tabIndex={0}
          aria-label="Timeline slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={sliderPosition}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
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

        {/* Vertical Time Indicator - Interactive Slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-purple-500 cursor-grab active:cursor-grabbing transition-all duration-200"
          style={{ left: `${sliderPosition}%` }}
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
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
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

        {/* Current Trading Overlaps */}
        <div className="mt-1 mb-1 min-w-[700px] lg:min-w-0">
          <div className="flex items-center gap-0.5">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 tools-heading whitespace-nowrap">Current Trading Overlaps:</h3>
            <div className="flex flex-nowrap gap-0.5 overflow-x-auto">
              {getTradingOverlaps().length > 0 ? (
                getTradingOverlaps().map((overlap, index) => (
                  <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                    {overlap}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">No active overlaps</span>
              )}
            </div>
          </div>
        </div>

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
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-white">{m.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{formatTime(currentTime, m.timezone)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(currentTime, m.timezone)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{m.sessionHours}</p>
                </div>
              </div>

              {/* Status */}
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium w-64">
                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
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
                  style={getSessionBarStyle(m.gmtHours)}
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
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">{m.gmtHours}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ForexMarketTimeZone;
