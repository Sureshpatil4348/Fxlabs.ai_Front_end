// DST-aware Forex market-hours engine.
// Implements spec: compute retail gate, per-session open/close (08:00–17:00 local),
// project sessions onto a 24h window in the viewer's timezone, and provide offsets/labels.

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
    { key: 'Sydney', tz: 'Australia/Sydney' },
    { key: 'London', tz: 'Europe/London' },
    { key: 'NewYork', tz: 'America/New_York' }
  ];

  const sessions = sessionsDef.map((def) => {
    const lp = getZonedParts(viewInstantUTC, def.tz);
    const openUTC = utcFromLocal(def.tz, lp.year, lp.month, lp.day, 8, 0, 0);
    const closeUTC = utcFromLocal(def.tz, lp.year, lp.month, lp.day, 17, 0, 0);

    const isOpenNow = gateOpen && (openUTC.getTime() <= viewInstantUTC.getTime()) && (viewInstantUTC.getTime() < closeUTC.getTime());

    // Project to viewer day window
    const startOverlap = new Date(Math.max(openUTC.getTime(), viewerWindow.startUTC.getTime()));
    const endOverlap = new Date(Math.min(closeUTC.getTime(), viewerWindow.endUTC.getTime()));
    const hasOverlap = startOverlap.getTime() < endOverlap.getTime();
    const projected = hasOverlap
      ? {
          startLocalISO: toLocalISOInZone(startOverlap, detectedViewerTz),
          endLocalISO: toLocalISOInZone(endOverlap, detectedViewerTz)
        }
      : null;

    return {
      session: def.key,
      cityTzLabel: def.tz,
      cityUtcOffsetNow: offsetToString(getOffsetMinutesAt(viewInstantUTC, def.tz)),
      cityClockNowLocal: toLocalISOInZone(viewInstantUTC, def.tz),
      sessionOpenUTC: openUTC.toISOString(),
      sessionCloseUTC: closeUTC.toISOString(),
      isOpenNow,
      projectedSegmentInViewer: projected
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

export default {
  computeMarketHours
};

// Friendly name derived from IANA zone (last path token)
function friendlyNameFromZone(tz) {
  const parts = tz.split('/');
  const last = parts[parts.length - 1] || tz;
  return last.replace(/_/g, ' ');
}

// List all supported IANA timezones with their current GMT offset for a given UTC instant
export function listTimezonesWithOffsets(viewInstantUTC = new Date()) {
  const zones = (typeof Intl.supportedValuesOf === 'function')
    ? Intl.supportedValuesOf('timeZone')
    : [
        'UTC',
        'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Dubai',
        'Australia/Sydney',
        'Europe/London', 'Europe/Berlin', 'Europe/Zurich',
        'America/New_York', 'America/Toronto', 'America/Los_Angeles'
      ];

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


