import { useMemo } from 'react';

/**
 * Custom hook for URL utilities and validation
 */
export const useUrlUtils = () => {
  const toAbsoluteUrl = useMemo(() => {
    return (input?: string): string => {
      if (!input) return '#';
      const trimmed = input.trim();
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      if (/^www\./i.test(trimmed) || /^([\w-]+\.)+[\w-]+/i.test(trimmed)) {
        return `https://${trimmed}`;
      }
      return trimmed;
    };
  }, []);

  const validateUrl = useMemo(() => {
    return (url: string): boolean => {
      try {
        new URL(toAbsoluteUrl(url));
        return true;
      } catch {
        return false;
      }
    };
  }, [toAbsoluteUrl]);

  return {
    toAbsoluteUrl,
    validateUrl
  };
};
