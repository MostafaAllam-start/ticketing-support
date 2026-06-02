// Inline brand SVGs, replacing the original design's @iconify `logos:*` icons so
// the page has no external icon dependency. `currentColor` lets each icon pick up
// its container's brand tint (WhatsApp green, LinkedIn blue).

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.64-1.56-.89-2.13-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.77.36-.26.29-1.01.98-1.01 2.4 0 1.41 1.03 2.78 1.18 2.97.14.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.31.19 1.81.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.04 2.5A9.49 9.49 0 0 0 4 17.03L2.5 21.5l4.6-1.49A9.49 9.49 0 1 0 12.04 2.5zm0 17.36a7.84 7.84 0 0 1-4-1.09l-.29-.17-2.72.89.9-2.65-.19-.3a7.85 7.85 0 1 1 6.3 3.31z" />
    </svg>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.67H5.67V18.3h2.67V9.67zM7 5.6a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1zm11.33 12.7v-4.74c0-2.53-1.35-3.71-3.16-3.71-1.46 0-2.11.8-2.48 1.37v-1.18h-2.67v8.63h2.67v-4.82c0-1.27.92-1.5 1.49-1.5.56 0 1.49.27 1.49 1.55v4.77h2.66z" />
    </svg>
  );
}
