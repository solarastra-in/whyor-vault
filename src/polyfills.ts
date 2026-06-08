import { Buffer } from 'buffer';
import process from 'process';
import EventEmitter from 'events';
import * as stream from 'stream-browserify';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  window.Buffer = window.Buffer || Buffer;
  window.process = window.process || process;
  (window as any).Stream = (stream as any).Stream || (stream as any).default?.Stream;
}
