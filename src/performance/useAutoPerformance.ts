import { useEffect, useRef, useState } from 'react';
import type { AutoPerformanceQuality } from './types';

function initialQuality(): AutoPerformanceQuality {
  if (typeof window === 'undefined') return 'balanced';

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return 'performance';
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 2 || memory <= 2) return 'performance';

  // Start conservatively. A device earns High only after sustained smooth
  // frames; this avoids a flashy first second followed by a visible FPS dip.
  return 'balanced';
}

function downshift(quality: AutoPerformanceQuality): AutoPerformanceQuality {
  if (quality === 'high') return 'balanced';
  return 'performance';
}

function upshift(quality: AutoPerformanceQuality): AutoPerformanceQuality {
  if (quality === 'performance') return 'balanced';
  return 'high';
}

/**
 * There is intentionally no manual setter. AnchorGrid always adapts itself.
 * The governor uses hysteresis so a single dropped frame never causes visual
 * quality to oscillate during a match.
 */
export function useAutoPerformance() {
  const [quality, setQuality] = useState<AutoPerformanceQuality>(initialQuality);
  const qualityRef = useRef(quality);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    let raf = 0;
    let frameCount = 0;
    let sampleStartedAt = performance.now();
    let lowSamples = 0;
    let highSamples = 0;

    const frame = (time: number) => {
      if (document.visibilityState !== 'visible') {
        frameCount = 0;
        sampleStartedAt = time;
        raf = requestAnimationFrame(frame);
        return;
      }

      frameCount += 1;
      const elapsed = time - sampleStartedAt;

      if (elapsed >= 2000) {
        const measuredFps = Math.max(1, Math.min(60, frameCount * 1000 / elapsed));
        const current = qualityRef.current;

        if (measuredFps < 45) {
          lowSamples += 2;
          highSamples = 0;
        } else if (measuredFps < 53) {
          lowSamples += 1;
          highSamples = 0;
        } else if (measuredFps >= 58) {
          highSamples += 1;
          lowSamples = Math.max(0, lowSamples - 1);
        } else {
          lowSamples = Math.max(0, lowSamples - 1);
          highSamples = 0;
        }

        if (lowSamples >= 3 && current !== 'performance') {
          const next = downshift(current);
          qualityRef.current = next;
          setQuality(next);
          lowSamples = 0;
          highSamples = 0;
        } else if (highSamples >= 5 && current !== 'high') {
          const next = upshift(current);
          qualityRef.current = next;
          setQuality(next);
          lowSamples = 0;
          highSamples = 0;
        }

        frameCount = 0;
        sampleStartedAt = time;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return {
    quality,
    automatic: true as const
  };
}
