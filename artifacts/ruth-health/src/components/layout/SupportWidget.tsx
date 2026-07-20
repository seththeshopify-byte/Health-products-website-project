import { useState } from "react";
import { Phone, MessageSquare, X, HelpCircle } from "lucide-react";

const PHONE_DISPLAY = "+1 (807) 709-2017";
const PHONE_TEL = "+18077092017";
const WHATSAPP_NUMBER = "18077092017";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.876.52 3.63 1.42 5.13L2 22l4.998-1.375A9.955 9.955 0 0012.001 22C17.524 22 22 17.522 22 12S17.524 2 12.001 2zm0 18.062a8.03 8.03 0 01-4.098-1.122l-.294-.175-3.048.839.822-2.998-.192-.309A8.05 8.05 0 013.938 12c0-4.453 3.613-8.062 8.063-8.062 4.449 0 8.062 3.609 8.062 8.062 0 4.452-3.613 8.062-8.062 8.062z"/>
    </svg>
  );
}

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-3">
      {open && (
        <div className="flex flex-col gap-2">
          <a href={"https://wa.me/" + WHATSAPP_NUMBER} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-card border shadow-lg rounded-full pl-4 pr-5 py-3 hover:shadow-xl transition-all">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">WhatsApp</span>
          </a>

          <a href={"sms:" + PHONE_TEL} className="flex items-center gap-3 bg-card border shadow-lg rounded-full pl-4 pr-5 py-3 hover:shadow-xl transition-all">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">Text Us</span>
          </a>

          <a href={"tel:" + PHONE_TEL} className="flex items-center gap-3 bg-card border shadow-lg rounded-full pl-4 pr-5 py-3 hover:shadow-xl transition-all">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground">
              <Phone className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">Call {PHONE_DISPLAY}</span>
          </a>
        </div>
      )}

      <button onClick={() => setOpen(!open)} aria-label="Get help" className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all pl-4 pr-5 py-3">
        {open ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
        <span className="text-sm font-medium">{open ? "Close" : "Get Help"}</span>
      </button>
    </div>
  );
}
