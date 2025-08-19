// Cache buster utility for forcing fresh calculations
export function getCacheBuster(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function forceTimelineRecalculation(releaseId: string): void {
  // Force DOM reflow to ensure fresh rendering
  const element = document.getElementById(`timeline-bar-${releaseId}`);
  if (element) {
    element.style.display = 'none';
    element.offsetHeight; // Force reflow
    element.style.display = '';
  }
}

// Debug helper for new tab issues
export function debugNewTabCache(): void {
  console.log('NEW TAB CACHE DEBUG:', {
    url: window.location.href,
    timestamp: Date.now(),
    performance: window.performance.now(),
    userAgent: navigator.userAgent.substring(0, 80),
    referrer: document.referrer || 'direct',
    cacheStatus: 'FRESH_TAB_LOAD'
  });
}