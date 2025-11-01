import React, { useEffect, useRef, useState } from 'react';

import { useDrawingTools } from '../hooks/useDrawingTools';
import { useChartStore } from '../stores/useChartStore';

export const Sidebar = () => {
  const { 
    settings, 
    setCursorType,
    klineChartRef
  } = useChartStore();
  
  const {
    activeTool,
    setActiveTool
  } = useDrawingTools();

  // KLine drawing tools handlers
  const handleKLineToolSelect = (toolId) => {
    if (klineChartRef && klineChartRef._handleDrawingToolChange) {
      try {
        klineChartRef._handleDrawingToolChange(toolId);
        setActiveTool(toolId);
        console.log('📈 KLine Drawing tool activated:', toolId);
      } catch (error) {
        console.warn('📈 Error activating KLine drawing tool:', error);
      }
    }
  };
  
  const handleKLineClearAll = () => {
    if (!window.confirm('Clear all drawings? This cannot be undone.')) {
      return;
    }
    if (klineChartRef) {
      try {
        const overlays = klineChartRef.getAllOverlays();
        overlays.forEach(overlay => {
          klineChartRef.removeOverlay(overlay.id);
        });
        console.log('📈 All KLine drawings cleared');
      } catch (error) {
        console.warn('📈 Error clearing KLine drawings:', error);
      }
    }
  };
  
  return (
    <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2 h-full min-h-0 overflow-y-auto">
      {/* Cursor Types: moved to top; outlined icons, active = blue */}
      <CursorMenu
        current={settings.cursorType}
        onSelect={(type) => setCursorType(type)}
      />

      {/* K-Line Tools: icon-only buttons with outlined grey icons; active = blue */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('trendLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'trendLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Trend Line"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20l8-8 4 4 4-4" />
            <circle cx="4" cy="20" r="1.25" fill="currentColor" />
            <circle cx="12" cy="12" r="1.25" fill="currentColor" />
            <circle cx="16" cy="16" r="1.25" fill="currentColor" />
            <circle cx="20" cy="12" r="1.25" fill="currentColor" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Trend Line
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('horizontalLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'horizontalLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Horizontal Line"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Horizontal Line
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('verticalLine')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'verticalLine' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Vertical Line"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Vertical Line
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('fibonacci')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'fibonacci' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Fib Retracement"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5h4M6 9h8M6 13h10M6 17h12" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16m16-16v16" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Fib Retracement
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('fibExtension')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'fibExtension' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Fib Extension (3pt)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h6m0 0l3-3m-3 3l3 3M18 5v14" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Fib Extension (3pt)
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('rectangle')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'rectangle' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Rectangle"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="1.5" ry="1.5" strokeWidth={2} />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Rectangle
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => handleKLineToolSelect('text')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'text' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M12 7v10m-5 0h10" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Text
        </div>
      </div>

      {/* Clear All drawings icon */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleKLineClearAll}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-red-500 hover:text-red-600"
          title="Clear All"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Clear All
        </div>
      </div>

      {/* pointer menu moved above; divider removed */}
    </div>
  );
};

// Local inline component to keep file cohesion and avoid broad changes
const CursorMenu = ({ current, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!open) return;
      const b = btnRef.current;
      const m = menuRef.current;
      if (b && b.contains(e.target)) return;
      if (m && m.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    }
  }, [open]);

  const iconClass = `w-5 h-5`;
  const renderIcon = (type) => {
    if (type === 'grab') {
      // Outlined hand/grab icon
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11v2a5 5 0 0010 0V9a1.5 1.5 0 00-3 0v2M7 11V8a1.5 1.5 0 013 0v3M7 11a1.5 1.5 0 00-3 0v2a7 7 0 0014 0V8a1.5 1.5 0 00-3 0" />
        </svg>
      );
    }
    if (type === 'pointer') {
      // Outlined mouse pointer arrow
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3l10 5-6 2 4 8-3 1-4-8-4 2 3-10z" />
        </svg>
      );
    }
    // Crosshair: outlined cross with central mark
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4M12 17v4M3 12h4M17 12h4" />
        <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      </svg>
    );
  };

  const label = current === 'grab' ? 'Grab' : current === 'pointer' ? 'Pointer' : 'Crosshair';

  return (
    <div className="relative" ref={menuRef}>
      <div className="relative group">
        <button
          type="button"
          ref={btnRef}
          onClick={() => setOpen((v) => !v)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            current ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title={`${label} (click to change)`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {renderIcon(current)}
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          {label}
        </div>
      </div>

      {open && (
        <div
          role="menu"
          ref={menuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg w-36 py-1"
          style={{ top: menuPos.top, left: menuPos.left, transform: 'translateY(-50%)', zIndex: 1000 }}
        >
          {[
            { id: 'crosshair', name: 'Crosshair' },
            { id: 'pointer', name: 'Pointer' },
            { id: 'grab', name: 'Grab' },
          ].map((opt) => (
            <button
              key={opt.id}
              role="menuitem"
              type="button"
              onClick={() => { onSelect(opt.id); setOpen(false); }}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${
                current === opt.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className={`inline-flex ${current === opt.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {renderIcon(opt.id)}
              </span>
              <span className="flex-1">{opt.name}</span>
              {current === opt.id && (
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
