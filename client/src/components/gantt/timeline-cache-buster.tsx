import { useEffect } from 'react';

// Comprehensive timeline cache buster for new tab consistency
export function TimelineCacheBuster() {
  useEffect(() => {
    // Force all timeline elements to recalculate positioning
    const forceTimelineRecalculation = () => {
      const timelineBars = document.querySelectorAll('[id^="timeline-bar-"]');
      
      timelineBars.forEach((bar: Element) => {
        const htmlBar = bar as HTMLElement;
        // Force browser to recalculate styles
        htmlBar.style.opacity = '0.99';
        htmlBar.offsetHeight; // Force reflow
        htmlBar.style.opacity = '1';
        
        // Trigger style recalculation
        htmlBar.style.transform += '';
        htmlBar.offsetWidth; // Force another reflow
      });
      
      console.log('TIMELINE CACHE BUSTER: Forced recalculation of', timelineBars.length, 'timeline bars');
    };

    // Initial force calculation
    setTimeout(forceTimelineRecalculation, 100);
    
    // Force recalculation on visibility change (new tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(forceTimelineRecalculation, 50);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This component doesn't render anything
}