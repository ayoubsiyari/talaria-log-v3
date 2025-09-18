import React, { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    // Memory usage (if available)
    if (performance.memory) {
      const updateMemory = () => {
        setMemoryUsage({
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        });
      };
      
      updateMemory();
      const memoryInterval = setInterval(updateMemory, 2000);
      
      return () => {
        cancelAnimationFrame(animationId);
        clearInterval(memoryInterval);
      };
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50 backdrop-blur-sm border border-white/20">
      <div className="mb-2">
        <strong>Performance Monitor</strong>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-2 text-red-400 hover:text-red-300"
        >
          ×
        </button>
      </div>
      <div>FPS: {fps}</div>
      {memoryUsage && (
        <div>
          Memory: {memoryUsage.used}MB / {memoryUsage.total}MB
        </div>
      )}
      <div className="text-gray-400 text-xs mt-1">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;



