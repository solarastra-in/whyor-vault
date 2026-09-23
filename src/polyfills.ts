import { Buffer } from 'buffer';
import process from 'process';
import EventEmitter from 'events';
import * as stream from 'stream-browserify';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;
  (window as any).Stream = (stream as any).Stream || (stream as any).default?.Stream;

  // Modern browsers deprecate the 'unload' event via Permissions Policy to protect bfcache.
  // Intercept 'unload' registrations from third-party scripts (e.g. gapi) and gracefully map them to 'pagehide'.
  try {
    const originalAddEventListener = window.addEventListener.bind(window);
    window.addEventListener = function (type: string, listener: any, options?: any) {
      if (type === 'unload') {
        return originalAddEventListener('pagehide', listener, options);
      }
      return originalAddEventListener(type, listener, options);
    };

    // Also guard onunload property assignment
    Object.defineProperty(window, 'onunload', {
      get() {
        return (window as any)._onunload || null;
      },
      set(fn) {
        (window as any)._onunload = fn;
        if (fn) {
          window.addEventListener('pagehide', fn);
        }
      },
      configurable: true,
      enumerable: true
    });
  } catch (_e) {
    // Passively ignore in restricted environments
  }

  // Intercept benign environment-level unhandled promise rejections (disabled dev HMR WebSockets & extension message channels)
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');

    if (
      msg.includes('WebSocket') ||
      msg.includes('message channel closed') ||
      msg.includes('A listener indicated an asynchronous response') ||
      msg.includes('QUIC') ||
      msg.includes('Permissions policy violation')
    ) {
      // Prevent browser default logging of these external/benign dev warnings
      event.preventDefault();
    }
  });
}
