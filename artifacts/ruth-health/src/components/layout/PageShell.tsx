import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useRefCode } from "@/hooks/use-ref-code";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PageShell({ children }: { children: React.ReactNode }) {
  // Capture ref code from URL automatically
  useRefCode();
  
  const [showCookie, setShowCookie] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ruth_cookie_consent")) {
      setShowCookie(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("ruth_cookie_consent", "true");
    setShowCookie(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      
      {showCookie && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 animate-in slide-in-from-bottom-full">
          <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              We use cookies to improve your experience and track referrals. 
              By continuing to browse, you agree to our <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
            <div className="flex shrink-0 gap-3">
              <Button onClick={acceptCookies} size="sm">
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
