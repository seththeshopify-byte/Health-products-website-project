import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  /** Path (e.g. "/products/1") or full URL to share */
  url: string;
  /** Item name — may contain HTML, it will be stripped automatically */
  title: string;
  /** Optional short description — may contain HTML, it will be stripped automatically */
  text?: string;
  /** Override the default corner-button styling */
  className?: string;
}

function stripHtml(input: string): string {
  const div = document.createElement("div");
  div.innerHTML = input;
  return (div.textContent || div.innerText || "").trim();
}

const DEFAULT_BUTTON_CLASS =
  "absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm text-foreground shadow-sm transition-transform hover:bg-background hover:scale-105";

/**
 * Small share icon button meant to sit in a corner of a product/service/room/
 * course/menu-item card. On mobile it opens the device's native share sheet
 * (WhatsApp, Facebook, Messages, everything installed). On desktop, where the
 * native Web Share API usually isn't available, it falls back to a small
 * dropdown with direct WhatsApp/Facebook/Twitter/Telegram links plus Copy Link.
 *
 * Always call this from inside a positioned (relative) ancestor.
 */
export function ShareButton({ url, title, text, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getFullUrl = () => (url.startsWith("http") ? url : `${window.location.origin}${url}`);

  const cleanTitle = stripHtml(title || "");
  const cleanText = text ? stripHtml(text) : undefined;

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.share({ title: cleanTitle, text: cleanText, url: getFullUrl() });
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullUrl());
      setCopied(true);
      toast({ title: "Link copied" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  if (hasNativeShare) {
    return (
      <button
        type="button"
        aria-label="Share"
        onClick={handleNativeShare}
        className={className ?? DEFAULT_BUTTON_CLASS}
      >
        <Share2 size={16} />
      </button>
    );
  }

  const fullUrl = getFullUrl();
  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${cleanTitle} ${fullUrl}`)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    },
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanTitle)}&url=${encodeURIComponent(fullUrl)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(cleanTitle)}`,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Share"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={className ?? DEFAULT_BUTTON_CLASS}
        >
          <Share2 size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {shareLinks.map((link) => (
          <DropdownMenuItem key={link.label} asChild>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void handleCopy();
          }}
        >
          {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
