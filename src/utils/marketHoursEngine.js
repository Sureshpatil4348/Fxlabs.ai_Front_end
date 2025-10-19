// DST-aware Forex market-hours engine.
// Implements spec: compute retail gate and project sessions onto a 24h window
// in the viewer's timezone with offsets/labels.
//
// IMPORTANT: Session definitions follow the BabyPips liquidity-window convention:
// - London:   08:00–17:00 local (yields 07:00–16:00 UTC in BST, 08:00–17:00 UTC in GMT)
// - New York: 08:00–17:00 local (yields 12:00–21:00 UTC in EDT, 13:00–22:00 UTC in EST)
// - Sydney:   07:00–16:00 local (yields 20:00–05:00 UTC in AEDT, 21:00–06:00 UTC in AEST)
// Using local times ensures DST transitions are handled by the timezone database.

// Helper: zero-pad to 2 digits
const pad2 = (n) => String(n).padStart(2, '0');

// Helper: obtain time parts of a UTC instant represented in a target IANA timezone
function getZonedParts(dateUTC, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(dateUTC);

  const map = Object.create(null);
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const y = parseInt(map.year, 10);
  const m = parseInt(map.month, 10);
  const d = parseInt(map.day, 10);
  const hh = parseInt(map.hour, 10);
  const mm = parseInt(map.minute, 10);
  const ss = parseInt(map.second, 10);
  return { year: y, month: m, day: d, hour: hh, minute: mm, second: ss };
}

// Helper: format local parts to ISO-like local string (no timezone designator)
function toLocalISO(parts) {
  const { year, month, day, hour, minute, second } = parts;
  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

// Compute offset minutes of a timezone at a given UTC instant
function getOffsetMinutesAt(dateUTC, timeZone) {
  const p = getZonedParts(dateUTC, timeZone);
  const pseudoUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const diffMin = Math.round((pseudoUTC - dateUTC.getTime()) / 60000);
  return diffMin; // e.g., +330 for Asia/Kolkata
}

function offsetToString(mins) {
  const sign = mins >= 0 ? '+' : '-';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${pad2(h)}:${pad2(m)}`;
}

// Convert a local wall time in a timezone to its corresponding UTC instant
// Uses fixed-point iteration to account for DST offsets at that local time
function utcFromLocal(timeZone, y, m, d, hh = 0, mm = 0, ss = 0) {
  // initial guess: treat local as if UTC
  let guess = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
  for (let i = 0; i < 4; i += 1) {
    const offset = getOffsetMinutesAt(new Date(guess), timeZone);
    const next = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0) - offset * 60000;
    if (Math.abs(next - guess) < 500) {
      guess = next;
      break;
    }
    guess = next;
  }
  return new Date(guess);
}

function addDaysUTC(dateUTC, days) {
  return new Date(dateUTC.getTime() + days * 86400000);
}

// Determine if the retail gate (Sun 17:00 ET → Fri 17:00 ET) is open
function isRetailGateOpen(viewInstantUTC) {
  const et = getZonedParts(viewInstantUTC, 'America/New_York');
  const dayOfWeek = new Date(Date.UTC(et.year, et.month - 1, et.day)).getUTCDay(); // 0=Sun
  const mins = et.hour * 60 + et.minute;
  if (dayOfWeek === 6) return false; // Saturday
  if (dayOfWeek === 0) return mins >= 17 * 60; // Sunday from 17:00
  if (dayOfWeek >= 1 && dayOfWeek <= 4) return true; // Mon-Thu all day
  if (dayOfWeek === 5) return mins < 17 * 60; // Friday until 16:59:59
  return false;
}

// Build the viewer's 24h window [startUTC, endUTC) for the local day containing viewInstantUTC
function getViewerWindowUTC(viewInstantUTC, viewerTz) {
  const vp = getZonedParts(viewInstantUTC, viewerTz);
  const startUTC = utcFromLocal(viewerTz, vp.year, vp.month, vp.day, 0, 0, 0);
  // Calculate endUTC: viewer's local midnight tomorrow (24-hour window)
  const dayPlus = addDaysUTC(startUTC, 1);
  const endUTC = utcFromLocal(viewerTz, getZonedParts(dayPlus, viewerTz).year, getZonedParts(dayPlus, viewerTz).month, getZonedParts(dayPlus, viewerTz).day, 0, 0, 0);
  return { startUTC, endUTC, startLocalISO: toLocalISO({ ...vp, hour: 0, minute: 0, second: 0 }) };
}

function toLocalISOInZone(dateUTC, tz) {
  return toLocalISO(getZonedParts(dateUTC, tz));
}

// Main engine function
export function computeMarketHours({ viewInstantUTC = new Date(), viewerTz } = {}) {
  const detectedViewerTz = viewerTz || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const gateOpen = isRetailGateOpen(viewInstantUTC);
  const viewerOffset = offsetToString(getOffsetMinutesAt(viewInstantUTC, detectedViewerTz));
  const viewerClockNowLocal = toLocalISOInZone(viewInstantUTC, detectedViewerTz);

  const viewerWindow = getViewerWindowUTC(viewInstantUTC, detectedViewerTz);

  const sessionsDef = [
    // BabyPips liquidity windows expressed as local wall-times
    { key: 'Sydney', tz: 'Australia/Sydney', open: 7, close: 16 },
    { key: 'London', tz: 'Europe/London', open: 8, close: 17 },
    { key: 'NewYork', tz: 'America/New_York', open: 8, close: 17 }
  ];

  const sessions = sessionsDef.map((def) => {
    // Build candidate local days based on the viewer's 24h window boundaries
    const startLocal = getZonedParts(viewerWindow.startUTC, def.tz);
    const endLocal = getZonedParts(viewerWindow.endUTC, def.tz);

    const candidateDays = [
      { year: startLocal.year, month: startLocal.month, day: startLocal.day },
      { year: endLocal.year, month: endLocal.month, day: endLocal.day }
    ];

    // Compute open/close UTC for each candidate local day
    const dayWindows = candidateDays.map((cd) => ({
      openUTC: utcFromLocal(def.tz, cd.year, cd.month, cd.day, def.open, 0, 0),
      closeUTC: utcFromLocal(def.tz, cd.year, cd.month, cd.day, def.close, 0, 0)
    }));

    // Project overlaps against the viewer's 24h window, dedup by timestamps
    const projectedSegmentsInViewer = [];
    const seen = new Set();
    const projectOverlap = (openUTC, closeUTC) => {
      const startOverlap = new Date(Math.max(openUTC.getTime(), viewerWindow.startUTC.getTime()));
      const endOverlap = new Date(Math.min(closeUTC.getTime(), viewerWindow.endUTC.getTime()));
      if (startOverlap.getTime() < endOverlap.getTime()) {
        const key = `${startOverlap.getTime()}|${endOverlap.getTime()}`;
        if (!seen.has(key)) {
          seen.add(key);
          projectedSegmentsInViewer.push({
            startLocalISO: toLocalISOInZone(startOverlap, detectedViewerTz),
            endLocalISO: toLocalISOInZone(endOverlap, detectedViewerTz)
          });
        }
      }
    };
    dayWindows.forEach((w) => projectOverlap(w.openUTC, w.closeUTC));

    // Determine open-now state if any candidate day session contains now
    const now = viewInstantUTC.getTime();
    const isOpenNow = gateOpen && dayWindows.some((w) => now >= w.openUTC.getTime() && now < w.closeUTC.getTime());

    // Backward-compat single segment (first), if any
    const projectedSegmentInViewer = projectedSegmentsInViewer[0] || null;
    
    // Debug logging disabled for production performance
    // Uncomment below for debugging session calculations
    /*
    if (def.tz === 'America/New_York' && process.env.NODE_ENV === 'development') {
      console.log(`\n=== NY Session Debug ===`);
      console.log(`Viewer window: ${viewerWindow.startUTC.toISOString()} → ${viewerWindow.endUTC.toISOString()}`);
      console.log(`\n[Yesterday's Session]`);
      console.log(`  Open UTC: ${yesterdayOpenUTC.toISOString()}`);
      console.log(`  Close UTC: ${yesterdayCloseUTC.toISOString()}`);
      console.log(`  Extends into today: ${yesterdayExtendsIntoToday}`);
      console.log(`  Check: ${yesterdayCloseUTC.getTime()} > ${viewerWindow.startUTC.getTime()} = ${yesterdayCloseUTC.getTime() > viewerWindow.startUTC.getTime()}`);
      console.log(`\n[Today's Session]`);
      console.log(`  Open UTC: ${todayOpenUTC.toISOString()}`);
      console.log(`  Close UTC: ${todayCloseUTC.toISOString()}`);
      console.log(`  Overlaps window: ${todayOverlapsWindow}`);
      console.log(`  Check: ${todayOpenUTC.getTime()} < ${viewerWindow.endUTC.getTime()} && ${todayCloseUTC.getTime()} > ${viewerWindow.startUTC.getTime()}`);
      console.log(`  = ${todayOpenUTC.getTime() < viewerWindow.endUTC.getTime()} && ${todayCloseUTC.getTime() > viewerWindow.startUTC.getTime()}`);
      console.log(`\n[Result]`);
      console.log(`  Yesterday extends: ${yesterdayExtendsIntoToday}`);
      console.log(`  Today overlaps: ${todayOverlapsWindow}`);
      console.log(`  Segments count: ${projectedSegmentsInViewer.length}`);
      projectedSegmentsInViewer.forEach((seg, idx) => {
        console.log(`    Segment ${idx + 1}: ${seg.startLocalISO} → ${seg.endLocalISO}`);
      });
      console.log(`  isOpenNow: ${isOpenNow}`);
      console.log(`======================\n`);
    }
    */
    
    const projected = projectedSegmentInViewer;

    return {
      session: def.key,
      cityTzLabel: def.tz,
      cityUtcOffsetNow: offsetToString(getOffsetMinutesAt(viewInstantUTC, def.tz)),
      cityClockNowLocal: toLocalISOInZone(viewInstantUTC, def.tz),
      // Expose the first candidate day window as representative open/close (UI uses segments)
      sessionOpenUTC: (dayWindows[0]?.openUTC || viewerWindow.startUTC).toISOString(),
      sessionCloseUTC: (dayWindows[0]?.closeUTC || viewerWindow.endUTC).toISOString(),
      isOpenNow,
      projectedSegmentInViewer: projected,
      projectedSegmentsInViewer
    };
  });

  return {
    viewer: {
      viewerTzLabel: detectedViewerTz,
      viewerUtcOffsetNow: viewerOffset,
      viewerClockNowLocal,
      retailGateOpen: gateOpen
    },
    sessions
  };
}

const marketHoursEngine = {
  computeMarketHours
};

export default marketHoursEngine;

// Friendly name derived from IANA zone (last path token)
function friendlyNameFromZone(tz) {
  const parts = tz.split('/');
  const last = parts[parts.length - 1] || tz;
  return last.replace(/_/g, ' ');
}

// List all supported IANA timezones with their current GMT offset for a given UTC instant
export function listTimezonesWithOffsets(viewInstantUTC = new Date()) {
  // Get system timezone to ensure it's always included
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  // Curated list of prominent timezones (one per GMT offset) with updated names
  let zones = [
    'Pacific/Midway',        // GMT-11:00
    'Pacific/Honolulu',      // GMT-10:00
    'America/Anchorage',     // GMT-09:00
    'America/Los_Angeles',   // GMT-08:00
    'America/Denver',        // GMT-07:00
    'America/Chicago',       // GMT-06:00
    'America/New_York',      // GMT-05:00
    'America/Caracas',       // GMT-04:00
    'America/St_Johns',      // GMT-03:30
    'America/Sao_Paulo',     // GMT-03:00
    'Atlantic/South_Georgia', // GMT-02:00
    'Atlantic/Azores',       // GMT-01:00
    'UTC',                   // GMT+00:00
    'Europe/London',         // GMT+00:00 (DST aware)
    'Europe/Paris',          // GMT+01:00
    'Europe/Athens',         // GMT+02:00
    'Europe/Moscow',         // GMT+03:00
    'Asia/Dubai',            // GMT+04:00
    'Asia/Kabul',            // GMT+04:30
    'Asia/Karachi',          // GMT+05:00
    'Asia/Kolkata',          // GMT+05:30 (updated from Calcutta)
    'Asia/Kathmandu',        // GMT+05:45
    'Asia/Dhaka',            // GMT+06:00
    'Asia/Yangon',           // GMT+06:30
    'Asia/Bangkok',          // GMT+07:00
    'Asia/Singapore',        // GMT+08:00
    'Asia/Tokyo',            // GMT+09:00
    'Australia/Adelaide',    // GMT+09:30
    'Australia/Sydney',      // GMT+10:00
    'Pacific/Noumea',        // GMT+11:00
    'Pacific/Auckland',      // GMT+12:00
    'Pacific/Tongatapu'      // GMT+13:00
  ];
  
  // Ensure system timezone is in the list
  if (!zones.includes(systemTimezone)) {
    zones = [systemTimezone, ...zones];
  }

  const items = zones.map((tz) => {
    const offsetMin = getOffsetMinutesAt(viewInstantUTC, tz);
    return {
      value: tz,
      label: friendlyNameFromZone(tz),
      gmt: offsetToString(offsetMin),
      offsetMinutes: offsetMin,
      flag: '🌐'
    };
  });

  // Sort by offset, then by label
  items.sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label));
  return items;
}
