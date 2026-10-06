(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArytmiToolboxAdapters = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const failure = (message, code = 'UNSUPPORTED') => Object.assign(new Error(message), { code });

  function createAdapter(env, options = {}) {
    const cap = env.Capacitor;
    if (options.nativePlugin) return nativeAdapter(env, options.nativePlugin, options);
    if (cap?.isNativePlatform?.()) return nativeAdapter(env, findPlugin(cap), options);
    return webAdapter(env, options);
  }

  /*
   * Find det native plugin. To veje, og rækkefølgen er ikke ligegyldig.
   *
   * Capacitors native bro lægger selv `window.Capacitor.Plugins.ArytmiTools`
   * ind i webviewen. `registerPlugin` derimod kommer fra @capacitor/core's
   * JavaScript — og det findes kun i en app, der bliver bundlet. Arytmi har
   * ingen bundler, så på telefonen er `registerPlugin` ikke defineret.
   *
   * Indtil 8/9 2026 spurgte den her kode KUN efter `registerPlugin` og kastede
   * "ArytmiTools er ikke registreret" på en telefon, hvor pluginet var
   * registreret helt korrekt og svarede {torch:true, measure:true, level:true}
   * på Capacitor.Plugins. Hele værktøjskassen var død i den pakkede app, og
   * fejlbeskeden pegede på integrationsvejledningen — det forkerte sted.
   * Fanget på en rigtig Galaxy S24. Ingen enhedstest kunne se det: de
   * indsætter alle sammen pluginet direkte med options.nativePlugin.
   */
  function findPlugin(cap) {
    const fraBroen = cap.Plugins && cap.Plugins.ArytmiTools;
    if (fraBroen) return fraBroen;
    if (typeof cap.registerPlugin === 'function') return cap.registerPlugin('ArytmiTools');
    throw failure('ArytmiTools er ikke registreret. Følg integrationsvejledningen.');
  }

  function nativeAdapter(env, plugin, options) {
    let generation = 0;
    let motionHandles = [];
    let torchHandle;
    let disposed = false;
    let queue = Promise.resolve();
    let levelQueue = Promise.resolve();
    let measureGeneration = 0;
    // Serialize hardware writes. A late 'on' can never overtake a later 'off'.
    function setTorch(enabled) {
      const next = queue.catch(() => {}).then(() => plugin.setTorch({ enabled: enabled && !disposed }));
      queue = next;
      return next;
    }
    async function clearLevel() {
      const old = motionHandles;
      motionHandles = [];
      await Promise.allSettled(old.map(h => h.remove()));
      await plugin.stopLevel();
    }
    function levelOperation(operation) {
      const next = levelQueue.catch(() => {}).then(operation);
      levelQueue = next;
      return next;
    }
    function stopLevel() {
      generation++;
      return levelOperation(clearLevel);
    }
    function cancelMeasurement() {
      measureGeneration++;
      return plugin.cancelMeasurement();
    }
    return {
      kind: 'native',
      capabilities: () => plugin.getCapabilities(),
      setTorch,
      async observeTorch(callback) {
        torchHandle = await plugin.addListener('torchChanged', e => callback(!!e.enabled));
        if (disposed) await torchHandle.remove();
      },
      startLevel(onSample, onError) {
        const token = ++generation;
        return levelOperation(async () => {
          if (disposed || token !== generation) return;
          await clearLevel();
          if (disposed || token !== generation) return;
          const handles = [];
          try {
            handles.push(await plugin.addListener('level', sample => {
              if (token === generation && !disposed) onSample(sample);
            }));
            handles.push(await plugin.addListener('levelError', e => {
              if (token === generation && !disposed) onError(new Error(e.message));
            }));
            if (token !== generation || disposed) {
              await Promise.allSettled(handles.map(h => h.remove())); return;
            }
            motionHandles = handles;
            await plugin.startLevel();
            // Still within the queue: the next owner has not started yet.
            if (token !== generation || disposed) await clearLevel();
          } catch (error) {
            await Promise.allSettled(handles.map(h => h.remove()));
            if (motionHandles === handles) motionHandles = [];
            await plugin.stopLevel().catch(() => {});
            throw error;
          }
        });
      },
      stopLevel,
      async measure() {
        const token = ++measureGeneration;
        await setTorch(false);
        await stopLevel();
        if (disposed || token !== measureGeneration) return { cancelled: true };
        return plugin.measure();
      },
      cancelMeasurement,
      async openWeather(url) {
        if (options.openExternal) return options.openExternal(url);
        if (env.Capacitor?.getPlatform?.() === 'android') return plugin.openWeather({ url });
        // iOS uses the documented HTTPS path through the native plugin.
        return plugin.openWeather({ url });
      },
      async suspend() {
        await Promise.allSettled([setTorch(false), stopLevel()]);
      },
      async dispose() {
        disposed = true;
        await Promise.allSettled([setTorch(false), stopLevel(), cancelMeasurement(), torchHandle?.remove()]);
      }
    };
  }

  function webAdapter(env, options) {
    let stream;
    let torchEpoch = 0;
    let motionEpoch = 0;
    let motionListener;
    let notifyTorch = () => {};
    let disposed = false;
    function stopStream(value) { value?.getTracks().forEach(track => track.stop()); }
    function stopLevel() {
      motionEpoch++;
      if (motionListener) env.removeEventListener('devicemotion', motionListener);
      motionListener = null;
      return Promise.resolve();
    }
    async function setTorch(enabled) {
      const token = ++torchEpoch;
      if (!enabled || disposed) {
        stopStream(stream); stream = undefined; notifyTorch(false);
        return { enabled: false };
      }
      if (!env.isSecureContext || !env.navigator.mediaDevices?.getUserMedia) {
        throw failure('Lommelygten kan ikke tændes herfra. Brug lygten i telefonens kontrolcenter.');
      }
      stopStream(stream); stream = undefined;
      let acquired;
      try {
        acquired = await env.navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (token !== torchEpoch || disposed) { stopStream(acquired); return { enabled: false }; }
        const track = acquired.getVideoTracks()[0];
        // Arytmi på hjemmeskærmen ER appen (K22) — der er ingen anden app at henvise til.
        if (!track?.getCapabilities?.().torch) throw failure('Telefonen lader ikke Arytmi styre lommelygten. Brug lygten i telefonens kontrolcenter.');
        // Retain pending tracks too, so close/background immediately releases them.
        stream = acquired;
        await track.applyConstraints({ advanced: [{ torch: true }] });
        if (token !== torchEpoch || disposed) { stopStream(acquired); return { enabled: false }; }
        stream = acquired;
        track.addEventListener?.('ended', () => {
          if (stream === acquired) { stream = undefined; notifyTorch(false); }
        });
        notifyTorch(true);
        return { enabled: true };
      } catch (error) { stopStream(acquired); if (stream === acquired) stream = undefined; throw error; }
    }
    return {
      kind: 'web',
      capabilities: async () => ({
        torch: !!env.navigator.mediaDevices?.getUserMedia && !!env.isSecureContext,
        level: !!env.DeviceMotionEvent && !!env.isSecureContext,
        measure: false
      }),
      setTorch,
      observeTorch: async callback => { notifyTorch = callback; },
      async startLevel(onSample) {
        stopLevel();
        const token = motionEpoch;
        if (disposed || !env.isSecureContext || !env.DeviceMotionEvent) throw failure('Niveaumåleren kræver en telefon med bevægelsessensor og HTTPS.');
        // Called directly by the user's click; requestPermission precedes every await.
        const permission = typeof env.DeviceMotionEvent.requestPermission === 'function'
          ? env.DeviceMotionEvent.requestPermission() : Promise.resolve('granted');
        if (await permission !== 'granted') throw failure('Sensoradgang blev ikke givet.', 'PERMISSION_DENIED');
        if (token !== motionEpoch || disposed) return;
        let gravitySign;
        motionListener = event => {
          const a = event.accelerationIncludingGravity;
          if (!a || ![a.x, a.y, a.z].every(Number.isFinite)) return;
          // WebKit and Chromium have historically used opposing gravity signs.
          // User starts screen upwards. Lock the sign for this sensor session;
          // never flip per frame, which would mistake screen-down for level.
          if (gravitySign === undefined) {
            if (Math.abs(a.z) < 3) return;
            gravitySign = a.z < 0 ? -1 : 1;
          }
          onSample({ x: a.x * gravitySign, y: a.y * gravitySign, z: a.z * gravitySign, timestamp: Date.now() });
        };
        env.addEventListener('devicemotion', motionListener);
      },
      stopLevel,
      measure: async () => { throw failure('Kameraopmåling er tilgængelig i Arytmi-appen på telefoner med AR-understøttelse.'); },
      cancelMeasurement: async () => {},
      async openWeather(url) {
        if (options.openExternal) return options.openExternal(url);
        // Invoke only from a click, not after waiting for geolocation.
        const opened = env.open(url, '_blank');
        if (!opened) throw new Error('Browseren blokerede åbningen. Brug linket til Yr nedenfor.');
        opened.opener = null;
      },
      suspend: async () => { await Promise.allSettled([setTorch(false), stopLevel()]); },
      async dispose() { disposed = true; await Promise.allSettled([setTorch(false), stopLevel()]); }
    };
  }
  return { createAdapter };
});
