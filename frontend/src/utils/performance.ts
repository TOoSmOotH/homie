import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';

// Generic memo comparison function
export const shallowEqual = (prevProps: any, nextProps: any): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (let key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// Enhanced memo with custom comparison
export const memoWithComparison = <P extends object>(
  Component: React.FC<P>,
  compare?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, compare || shallowEqual);
};

// Custom hook for stable callbacks
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = React.useRef<T>(callback);
  const stableCallback = React.useRef<T>((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T;

  useEffect(() => {
    callbackRef.current = callback;
  });

  return stableCallback.current;
};

// Custom hook for debounced values
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for previous value
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = React.useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// Custom hook for event callbacks that are stable
export const useEventCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = React.useRef<T>(callback);
  const stableCallback = React.useRef<T>((...args: any[]) => {
    return callbackRef.current(...args);
  }) as T;

  useEffect(() => {
    callbackRef.current = callback;
  });

  return stableCallback.current;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRenderTime(Date.now());

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered. Count: ${renderCount + 1}`);
    }
  });

  return { renderCount, lastRenderTime };
};

// Lazy loading with preloading
export const useLazyWithPreload = <T,>(
  importFunc: () => Promise<{ default: T }>,
  preloadTrigger?: () => boolean
) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComponent = useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    try {
      const module = await importFunc();
      setComponent(() => module.default);
    } catch (error) {
      console.error('Error loading component:', error);
    } finally {
      setLoading(false);
    }
  }, [Component, loading, importFunc]);

  useEffect(() => {
    if (preloadTrigger?.()) {
      loadComponent();
    }
  }, [preloadTrigger, loadComponent]);

  return { Component, loading, loadComponent };
};

// Intersection Observer hook for performance
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Memoization utilities
export const useExpensiveCalculation = <T,>(
  calculate: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(calculate, dependencies);
};

// Optimized context selector hook
export const useOptimizedSelector = <T, R>(
  selector: (state: T) => R,
  context: React.Context<T>
): R => {
  const state = React.useContext(context);
  return useMemo(() => selector(state), [selector, state]);
};

export default {
  memoWithComparison,
  useStableCallback,
  useDebounce,
  usePrevious,
  useEventCallback,
  usePerformanceMonitor,
  useLazyWithPreload,
  useIntersectionObserver,
  useExpensiveCalculation,
  useOptimizedSelector
};