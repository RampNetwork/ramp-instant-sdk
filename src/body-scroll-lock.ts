// Track if body scroll is locked
let isLocked = false;
let originalOverflow: string | null = null;
let originalPaddingRight: string | null = null;
let originalPosition: string | null = null;
let originalTop: string | null = null;
let originalLeft: string | null = null;
let originalWidth: string | null = null;
let originalHeight: string | null = null;
let scrollPosition: number | null = null;

/**
 * Check if the device is iOS
 */
function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  );
}

/**
 * Disables body scroll while preserving scroll position
 */
export function disableBodyScroll(): void {
  if (!isLocked) {
    const body = document.body;
    const scrollbarWidth = window.innerWidth - body.clientWidth;

    // Store original values
    originalOverflow = body.style.overflow;
    originalPaddingRight = body.style.paddingRight;
    originalPosition = body.style.position;
    originalTop = body.style.top;
    originalLeft = body.style.left;
    originalWidth = body.style.width;
    originalHeight = body.style.height;

    // Store scroll position
    scrollPosition = window.scrollY;

    // Prevent body scroll
    body.style.overflow = 'hidden';

    // Prevent layout shift by adding padding for scrollbar
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // iOS Safari specific handling
    if (isIOS()) {
      body.style.position = 'fixed';
      body.style.top = `-${scrollPosition}px`;
      body.style.left = '0';
      body.style.width = '100%';
      body.style.height = '100%';
      body.style.touchAction = 'none';
    }

    isLocked = true;
  }
}

/**
 * Re-enables body scroll
 */
export function clearAllBodyScrollLocks(): void {
  if (isLocked) {
    const body = document.body;

    // Restore original values
    body.style.overflow = originalOverflow || '';
    body.style.paddingRight = originalPaddingRight || '';
    body.style.position = originalPosition || '';
    body.style.top = originalTop || '';
    body.style.left = originalLeft || '';
    body.style.width = originalWidth || '';
    body.style.height = originalHeight || '';
    body.style.touchAction = '';

    // Restore scroll position for iOS
    if (isIOS() && scrollPosition !== null) {
      window.scrollTo(0, scrollPosition);
    }

    originalOverflow = null;
    originalPaddingRight = null;
    originalPosition = null;
    originalTop = null;
    originalLeft = null;
    originalWidth = null;
    originalHeight = null;
    scrollPosition = null;
    isLocked = false;
  }
}
