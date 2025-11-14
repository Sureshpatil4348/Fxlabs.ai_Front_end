import React, { useEffect, useRef, useState } from 'react';

import { useDrawingTools } from '../hooks/useDrawingTools';
import { useChartStore } from '../stores/useChartStore';
import { useSplitChartStore } from '../stores/useSplitChartStore';

export const Sidebar = () => {
  const { 
    settings, 
    setCursorType,
    klineChartRef: mainChartRef,
    setIndicatorsPreset,
    isWorkspaceHidden,
    setWorkspaceHidden
  } = useChartStore();
  
  const { klineChartRef: splitChartRef } = useSplitChartStore();
  
  // In split mode, drawing tools are activated on BOTH charts simultaneously
  // so the cursor changes appropriately on both charts
  
  const {
    activeTool,
    setActiveTool,
    clearAllDrawings
  } = useDrawingTools();

  // Toast notification state
  const [clickToast, setClickToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Show click toast helper
  const showClickToast = (toolName, position) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setClickToast({ toolName, position });
    
    // Auto-dismiss after 2 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setClickToast(null);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // KLine drawing tools handlers
  const handleKLineToolSelect = (toolId, toolName, event) => {
      try {
        // CRITICAL FIX: For position tools, always deactivate first, then reactivate
        // This ensures each button click starts a fresh drawing session
        const isPositionTool = (toolId === 'shortPosition' || toolId === 'longPosition');
      
      // In split mode, activate tool on BOTH charts so cursor works on both
      const chartsToUpdate = [];
      if (mainChartRef && mainChartRef._handleDrawingToolChange) {
        chartsToUpdate.push({ ref: mainChartRef, name: 'main' });
      }
      if (settings.isSplitMode && splitChartRef && splitChartRef._handleDrawingToolChange) {
        chartsToUpdate.push({ ref: splitChartRef, name: 'split' });
      }
      
      if (chartsToUpdate.length === 0) {
        console.warn('📈 No chart refs available for drawing tool');
        return;
      }
        
        if (isPositionTool && activeTool === toolId) {
          // Tool is already active - deactivate first, then reactivate after a brief delay
          console.log('🔄 Position tool already active, cycling...');
        chartsToUpdate.forEach(({ ref }) => {
          ref._handleDrawingToolChange(null);
        });
          setActiveTool(null);
          
          setTimeout(() => {
          chartsToUpdate.forEach(({ ref, name }) => {
            ref._handleDrawingToolChange(toolId);
            console.log(`📈 KLine Drawing tool reactivated on ${name} chart:`, toolId);
          });
            setActiveTool(toolId);
          }, 100);
        } else {
        // Normal activation - activate on all available charts
        chartsToUpdate.forEach(({ ref, name }) => {
          ref._handleDrawingToolChange(toolId);
          console.log(`📈 KLine Drawing tool activated on ${name} chart:`, toolId);
        });
          setActiveTool(toolId);
        }
        
        // Show click toast positioned next to the clicked button
        if (event && event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          showClickToast(toolName, {
            top: rect.top + rect.height / 2,
            left: rect.right + 12
          });
        } else {
          showClickToast(toolName);
        }
      } catch (error) {
        console.warn('📈 Error activating KLine drawing tool:', error);
    }
  };

  // Toggle visibility for all KLine overlays and indicators (no confirmation)
  const handleKLineToggleVisibility = () => {
    try {
      // Get all available charts
      const charts = [];
      if (mainChartRef) charts.push(mainChartRef);
      if (settings.isSplitMode && splitChartRef) charts.push(splitChartRef);
      
      if (!isWorkspaceHidden) {
        // 1) Hide all KLine overlays (best-effort via overrideOverlay visible: false)
        charts.forEach(chart => {
        if (chart) {
          try {
            const fetchOverlays = () => {
              try { if (typeof chart.getOverlays === 'function') return chart.getOverlays(); } catch (_) {}
              try { if (typeof chart.getAllOverlays === 'function') return chart.getAllOverlays(); } catch (_) {}
              return [];
            };
            const overlays = fetchOverlays();
            if (Array.isArray(overlays)) {
              overlays.forEach((ov) => {
                try { chart.overrideOverlay({ id: ov?.id, visible: false }); } catch (_) { /* ignore */ }
              });
            }
            // Dismiss any custom inline UI/panels
            try { if (typeof chart._dismissSelectedOverlayPanel === 'function') chart._dismissSelectedOverlayPanel(); } catch (_) { /* ignore */ }
          } catch (_) { /* ignore */ }
        }
        });
        // Also remove any stray inline editors or palettes injected in DOM
        try {
          document.querySelectorAll('.kv-inline-rect-editor,.kv-rect-color-palette').forEach((el) => {
            try { el.remove(); } catch (_) { /* ignore */ }
          });
        } catch (_) { /* ignore */ }

        // 2) Temporarily remove all indicators from the chart (without changing switches)
        charts.forEach(chart => {
        if (chart) {
          try {
            const tryRemoveByList = (list) => {
              if (!Array.isArray(list)) return;
              list.forEach((ind) => {
                try { chart.removeIndicator({ id: ind?.id, name: ind?.name, paneId: ind?.paneId }); } catch (_) {}
                try { chart.removeIndicator({ name: ind?.name }); } catch (_) {}
                try { chart.removeIndicator(ind?.id); } catch (_) {}
              });
            };
            let inds = [];
            try { inds = chart.getIndicators?.() || []; } catch (_) { inds = []; }
            if (!Array.isArray(inds) || inds.length === 0) {
              const panes = ['candle_pane', 'pane_0', 'pane_1', 'pane_2', 'pane-rsiEnhanced', 'pane-atrEnhanced', 'pane-macdEnhanced'];
              panes.forEach((pid) => {
                try { tryRemoveByList(chart.getIndicators?.({ paneId: pid }) || []); } catch (_) {}
              });
            } else {
              tryRemoveByList(inds);
            }
          } catch (_) { /* ignore */ }
        }
        });

        setWorkspaceHidden(true);
        console.log('📈 Workspace hidden: overlays hidden, indicators temporarily removed (switches unchanged)');
      } else {
        // 1) Unhide all overlays
        charts.forEach(chart => {
        if (chart) {
          try {
            const fetchOverlays = () => {
              try { if (typeof chart.getOverlays === 'function') return chart.getOverlays(); } catch (_) {}
              try { if (typeof chart.getAllOverlays === 'function') return chart.getAllOverlays(); } catch (_) {}
              return [];
            };
            const overlays = fetchOverlays();
            if (Array.isArray(overlays)) {
              overlays.forEach((ov) => {
                try { chart.overrideOverlay({ id: ov?.id, visible: true }); } catch (_) { /* ignore */ }
              });
            }
          } catch (_) { /* ignore */ }
        }
        });

        // 2) Re-apply indicator instances by emitting a no-op preset (same switches) to trigger chart effect
        try { setIndicatorsPreset({ ...(settings?.indicators || {}) }); } catch (_) { /* ignore */ }

        setWorkspaceHidden(false);
        console.log('📈 Workspace unhidden: overlays shown, indicators re-applied from switches');
      }
    } catch (e) {
      console.warn('📈 Error toggling workspace visibility:', e);
    }
  };
  
  const handleKLineClearAll = () => {
    const performClearAll = () => {
      // 1) Clear custom (Recharts) drawings managed by UniversalDrawingTools
      try { clearAllDrawings(); } catch (_) { /* ignore */ }

      // 2) Clear KLine overlays from all charts
      const charts = [];
      if (mainChartRef) charts.push(mainChartRef);
      if (settings.isSplitMode && splitChartRef) charts.push(splitChartRef);
      
      charts.forEach(klineChartRef => {
      if (klineChartRef) {
        try {
          // Robustly collect overlays (support both APIs)
          const fetchOverlays = () => {
            try {
              if (typeof klineChartRef.getOverlays === 'function') return klineChartRef.getOverlays();
              if (typeof klineChartRef.getAllOverlays === 'function') return klineChartRef.getAllOverlays();
            } catch (_) {}
            return [];
          };

          let safetyCounter = 0;
          while (safetyCounter < 10) {
            safetyCounter += 1;
            const overlays = fetchOverlays();
            if (!Array.isArray(overlays) || overlays.length === 0) break;

            let removedAny = false;
            overlays.forEach((ov) => {
              try { klineChartRef.removeOverlay({ id: ov?.id, paneId: ov?.paneId || ov?.pane?.id }); removedAny = true; } catch (_) {}
              try { klineChartRef.removeOverlay({ id: ov?.id }); removedAny = true; } catch (_) {}
              try { klineChartRef.removeOverlay(ov?.id); removedAny = true; } catch (_) {}
              // As last resort, attempt by common names (may remove all instances by name depending on lib)
              try { if (ov?.name) { klineChartRef.removeOverlay({ name: ov.name }); removedAny = true; } } catch (_) {}
            });

            // Extra pass for known overlay names in case id-based removal fails
            const knownNames = [
              'segment',
              'horizontalStraightLine',
              'verticalStraightLine',
              'fibonacciRightLine',
              'fibonacciTrendExtensionRight',
              'rectangle',
              'text',
              'shortPosition',
              'longPosition'
            ];
            knownNames.forEach((name) => {
              try { klineChartRef.removeOverlay({ name }); removedAny = true; } catch (_) {}
              try { klineChartRef.removeOverlay(name); removedAny = true; } catch (_) {}
            });

            if (!removedAny) break; // avoid infinite loop if API no-ops
          }

          console.log('📈 All KLine overlays cleared (robust)');
          try { if (typeof klineChartRef._dismissSelectedOverlayPanel === 'function') klineChartRef._dismissSelectedOverlayPanel(); } catch (_) { /* ignore */ }

          // Try to remove all indicators immediately (best-effort)
          try {
            const tryRemoveByList = (list) => {
              if (!Array.isArray(list)) return;
              list.forEach((ind) => {
                try { klineChartRef.removeIndicator({ id: ind?.id, name: ind?.name, paneId: ind?.paneId }); } catch (_) {}
                try { klineChartRef.removeIndicator({ name: ind?.name }); } catch (_) {}
                try { klineChartRef.removeIndicator(ind?.id); } catch (_) {}
              });
            };
            let inds = [];
            try { inds = klineChartRef.getIndicators?.() || []; } catch (_) { inds = []; }
            if (!Array.isArray(inds) || inds.length === 0) {
              const panes = ['candle_pane', 'pane_0', 'pane_1', 'pane_2'];
              panes.forEach((pid) => {
                try { tryRemoveByList(klineChartRef.getIndicators?.({ paneId: pid }) || []); } catch (_) {}
              });
            } else {
              tryRemoveByList(inds);
            }
          } catch (_) {}
        } catch (error) {
          console.warn('📈 Error clearing KLine overlays/indicators:', error);
        }
      }
      });

      // Turn off all indicator toggles via store so the effect cleans up consistently
      try {
        const cleared = Object.keys(settings?.indicators || {}).reduce((acc, key) => {
          acc[key] = false;
          return acc;
        }, {});
        setIndicatorsPreset(cleared);
      } catch (_) { /* ignore */ }

      // 3) Deactivate any active drawing tools (both KLine and Universal)
      try { setActiveTool(null); } catch (_) { /* ignore */ }
      charts.forEach(chartRef => {
        try { if (chartRef && typeof chartRef._handleDrawingToolChange === 'function') chartRef._handleDrawingToolChange(null); } catch (_) { /* ignore */ }
      });
    };

    // Prefer custom modal inside the KLine widget (use mainChartRef for modal)
    if (mainChartRef && typeof mainChartRef._openConfirmModal === 'function') {
      mainChartRef._openConfirmModal({
        title: 'Clear Workspace',
        message: 'Clear all indicators and drawings? This cannot be undone.',
        confirmText: 'Clear',
        cancelText: 'Cancel',
        onConfirm: performClearAll,
      });
      return;
    }

    // Fallback for environments without chart ref
    if (window.confirm('Clear all indicators and drawings? This cannot be undone.')) {
      performClearAll();
    }
  };
  
  return (
    <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-0.5 h-full min-h-0 overflow-y-auto overflow-x-hidden">
      {/* Click Toast Notification */}
      {clickToast && (
        <div 
          className="fixed z-[9999] fade-in"
          style={{
            top: clickToast.position ? `${clickToast.position.top}px` : '112px',
            left: clickToast.position ? `${clickToast.position.left}px` : '64px',
            transform: clickToast.position ? 'translateY(-50%)' : undefined
          }}
        >
          <div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-600 text-white px-4 py-1 rounded-lg shadow-md">
            <span className="text-sm font-semibold">{clickToast.toolName}</span>
          </div>
        </div>
      )}

      {/* Cursor Types: moved to top; outlined icons, active = blue */}
      <CursorMenu
        current={settings.cursorType}
        onSelect={(type) => setCursorType(type)}
      />

      {/* K-Line Tools: icon-only buttons with outlined grey icons; active = blue */}
      <div className="relative group">
        <button
          type="button"
          onClick={(e) => handleKLineToolSelect('trendLine', 'Trend Line', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'trendLine' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('horizontalLine', 'Horizontal Line', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'horizontalLine' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('verticalLine', 'Vertical Line', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'verticalLine' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('fibonacci', 'Fib Retracement', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'fibonacci' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('fibExtension', 'Fib Extension (3pt)', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'fibExtension' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('rectangle', 'Rectangle', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'rectangle' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
          onClick={(e) => handleKLineToolSelect('shortPosition', 'Short Position', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'shortPosition' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Short Position"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l8-8 4 4 4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13v4h4" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Short Position
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={(e) => handleKLineToolSelect('longPosition', 'Long Position', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'longPosition' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Long Position"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 8-4-4-4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 11V7h-4" />
          </svg>
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          Long Position
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={(e) => handleKLineToolSelect('text', 'Text', e)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            activeTool === 'text' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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

      {/* Hide/Unhide all overlays & indicators */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleKLineToggleVisibility}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isWorkspaceHidden ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
          title={isWorkspaceHidden ? 'Unhide All' : 'Hide All'}
          aria-pressed={isWorkspaceHidden}
        >
          {isWorkspaceHidden ? (
            // Eye with slash off -> show eye (unhide)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          ) : (
            // Eye -> hide
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19C5 19 1 12 1 12s1.386-2.432 3.868-4.5M9.88 4.24A9.99 9.99 0 0112 5c7 0 11 7 11 7a19.741 19.741 0 01-3.256 3.977M1 1l22 22" />
            </svg>
          )}
        </button>
        <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[13px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          {isWorkspaceHidden ? 'Unhide All' : 'Hide All'}
        </div>
      </div>

      {/* Clear All drawings icon */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleKLineClearAll}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-gray-700"
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
            current ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
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
                current === opt.id ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className={`inline-flex ${current === opt.id ? 'text-emerald-500' : 'text-gray-500'}`}>
                {renderIcon(opt.id)}
              </span>
              <span className="flex-1">{opt.name}</span>
              {current === opt.id && (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
