import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function safeCopyToClipboard(text: string): Promise<boolean> {
  // Try standard Navigator Clipboard API first
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("Navigator clipboard write permission denied/failed. Attempting DOM fallback.", err);
  }

  // Backup fallback: Create a synchronized offscreen textarea, focus it and perform native click event copy
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Set position to fixed/invisible out of standard viewport bounds to prevent layout shifts
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Critical: Native copy operations obstructed on current framing hierarchy.", err);
    return false;
  }
}

export function getCleanPreviewUrl(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Try process.env.APP_URL injected by the AI Studio platform
  try {
    const injectedUrl = (typeof process !== 'undefined' && process.env?.APP_URL) || '';
    if (injectedUrl && !injectedUrl.includes('MY_APP_URL') && injectedUrl.startsWith('http')) {
      return injectedUrl.endsWith('/') ? injectedUrl : (injectedUrl + '/');
    }
  } catch (e) {}

  // 2. Try parsing URL from window.location.href to avoid "null" origin in sandboxed iframes
  try {
    if (window.location && window.location.href) {
      const href = window.location.href;
      if (href.startsWith('http')) {
        const parsed = new URL(href);
        return parsed.protocol + '//' + parsed.host + '/';
      }
    }
  } catch (e) {
    console.warn("Failed to derive preview URL from window.location.href:", e);
  }

  // 3. Fallback to standard window.location.origin
  try {
    if (window.location && window.location.origin && window.location.origin !== 'null') {
      return window.location.origin + '/';
    }
  } catch (e) {}

  // 4. Default to "/" if absolutely nothing else can be determined securely
  return '/';
}

