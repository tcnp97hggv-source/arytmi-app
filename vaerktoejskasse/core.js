(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiToolboxCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const radians = Math.PI / 180;
  function coordinates(value) {
    if (!value || typeof value.latitude !== 'number' || typeof value.longitude !== 'number' ||
      !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) ||
      Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180) {
      throw new Error('Placeringen skal have gyldig breddegrad og længdegrad.');
    }
    return { latitude: value.latitude, longitude: value.longitude };
  }
  function weatherUrl(location) {
    if (!location) return 'https://www.yr.no/';
    const c = coordinates(location);
    return `https://www.yr.no/en/forecast/daily-table/${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`;
  }
  function vectorToLevel(sample, screenAngle = 0) {
    const { x, y, z } = sample || {};
    if (![x, y, z, screenAngle].every(Number.isFinite)) return null;
    const length = Math.hypot(x, y, z);
    if (length < 0.1) return null;
    const angle = screenAngle * radians;
    const sx = (x * Math.cos(angle) + y * Math.sin(angle)) / length;
    const sy = (y * Math.cos(angle) - x * Math.sin(angle)) / length;
    const sz = z / length;
    return {
      roll: Math.atan2(sx, sz) / radians,
      pitch: Math.atan2(sy, Math.hypot(sx, sz)) / radians,
      usable: sz >= 0.5 // Phone lying down, screen upwards, within 60 degrees.
    };
  }
  function relativeLevel(reading, zero = { roll: 0, pitch: 0 }) {
    if (!reading) return null;
    const roll = reading.roll - zero.roll;
    const pitch = reading.pitch - zero.pitch;
    return { roll, pitch, usable: reading.usable, balanced: reading.usable && Math.hypot(roll, pitch) <= 0.5 };
  }
  function calibration(reading) {
    if (!reading?.usable || Math.hypot(reading.roll, reading.pitch) > 10) {
      throw new Error('Læg telefonen næsten fladt, før du sætter et nulpunkt.');
    }
    return { roll: reading.roll, pitch: reading.pitch };
  }
  function formatDistance(meters) {
    if (!Number.isFinite(meters) || meters <= 0 || meters > 100) throw new Error('Målingen er ugyldig. Prøv igen.');
    return meters < 1
      ? `${(meters * 100).toLocaleString('da-DK', { maximumFractionDigits: 1 })} cm`
      : `${meters.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  }
  /* Rettet 6/9 (KN): koden slog OP i kortet FØR den så på beskeden, og derfor
     blev "Kameraopmåling er tilgængelig i Arytmi-appen på telefoner med
     AR-understøttelse" til det intetsigende "Denne funktion er ikke
     tilgængelig på enheden." Samme sted forsvandt lommelygtens forklaring.
     Rækkefølgen nu: browserens egne engelske fejl (kendt på .name)
     oversættes; vores egne og de nativ-leverede fejl bærer allerede en præcis
     dansk forklaring og får lov at beholde den; kortet er sidste udvej. */
  function errorMessage(error) {
    if (!error) return 'Noget gik galt. Prøv igen.';
    const messages = {
      PERMISSION_DENIED: 'Adgangen blev ikke givet. Du kan ændre tilladelsen i telefonens indstillinger.',
      NotAllowedError: 'Adgangen blev ikke givet. Du kan ændre tilladelsen i browserens eller telefonens indstillinger.',
      NotFoundError: 'Telefonen har ikke det nødvendige kamera.',
      NotReadableError: 'Kameraet er optaget. Luk andre kameraapps, og prøv igen.',
      UNSUPPORTED: 'Denne funktion er ikke tilgængelig på enheden.',
      BUSY: 'Kameraet er allerede i brug. Luk målingen, og prøv igen.',
      HARDWARE_ERROR: 'Telefonen kunne ikke starte funktionen. Prøv igen.',
      CANCELLED: 'Handlingen blev afbrudt.'
    };
    if (error.name && messages[error.name]) return messages[error.name];
    const own = typeof error.message === 'string' ? error.message.trim() : '';
    if (own) return own;
    return messages[error.code] || 'Noget gik galt. Prøv igen.';
  }
  return { coordinates, weatherUrl, vectorToLevel, relativeLevel, calibration, formatDistance, errorMessage };
});
