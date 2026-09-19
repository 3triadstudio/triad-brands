import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useSiteSettings } from "@/lib/storefront";

export function WhatsAppFloating() {
  const { data: settings } = useSiteSettings();
  const [isHovering, setIsHovering] = useState(false);

  if (!settings?.contacts.whatsapp) return null;

  const whatsappNumber = settings.contacts.whatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hi%20Triad%20Studio%2C%20I%27m%20interested%20in%20your%20services`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex min-h-12 items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-[background-color,box-shadow] duration-300 hover:bg-[#20BA5A] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <MessageCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      {isHovering && <span className="whitespace-nowrap text-sm font-medium">Chat with us</span>}
    </a>
  );
}
