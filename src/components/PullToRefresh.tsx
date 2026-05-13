'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Ignore if touching the FAB menu
      if ((e.target as Element).closest('.fab-menu')) {
        startY.current = -1;
        return;
      }

      // Only pull if we are at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      } else {
        startY.current = -1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === -1 || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Friction effect: the more you pull, the harder it gets
        const distance = Math.min(diff * 0.4, threshold + 20);
        setPullDistance(distance);
        
        // Prevent default browser scroll if we are pulling down
        if (distance > 5) {
          if (e.cancelable) e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= threshold) {
        setRefreshing(true);
        setPullDistance(60);
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setPullDistance(0);
      }
      startY.current = -1;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing]);

  return (
    <div 
      className="ptr-indicator" 
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      <div className="ptr-circle">
        {refreshing ? (
          <div className="ptr-spinner" />
        ) : (
          <RefreshCw 
            size={18} 
            style={{ 
              transform: `rotate(${pullDistance * 3}deg)`,
              opacity: Math.min(pullDistance / threshold, 1)
            }} 
          />
        )}
      </div>
    </div>
  );
}
