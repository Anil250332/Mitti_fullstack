import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

/**
 * A floating WhatsApp widget fixed to the bottom-right of the screen.
 * Clicking it opens a WhatsApp chat with the specified number.
 */
export default function WhatsAppWidget() {
    const phoneNumber = "7999980799";
    const whatsappUrl = `https://wa.me/91${phoneNumber}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-6 sm:bottom-8 sm:right-8"
            aria-label="Contact us on WhatsApp"
        >
            <FaWhatsapp size={32} />

            {/* Pulsing Aura Effect */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 -z-10" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-40 -z-10" />
        </a>
    );
}
