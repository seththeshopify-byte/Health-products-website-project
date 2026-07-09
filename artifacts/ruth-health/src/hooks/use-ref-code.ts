import { useEffect } from "react";
import { useLocation } from "wouter";

export const REF_CODE_KEY = "ruth_health_ref_code";

export function useRefCode() {
  const [location] = useLocation();

  useEffect(() => {
    // Basic search params parsing since wouter doesn't have a built-in hook
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const refCode = params.get("ref");
    
    if (refCode) {
      localStorage.setItem(REF_CODE_KEY, refCode);
    }
  }, [location]);

  return {
    getRefCode: () => localStorage.getItem(REF_CODE_KEY)
  };
}
