// Simple SVG golf icons — no external libraries
export function GolfBallIcon({ size = 32, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
      <circle cx="13" cy="12" r="1.2" fill="rgba(0,0,0,0.15)"/>
      <circle cx="18" cy="10" r="1.2" fill="rgba(0,0,0,0.15)"/>
      <circle cx="20" cy="15" r="1.2" fill="rgba(0,0,0,0.15)"/>
      <circle cx="16" cy="20" r="1.2" fill="rgba(0,0,0,0.15)"/>
      <circle cx="11" cy="17" r="1.2" fill="rgba(0,0,0,0.15)"/>
      <circle cx="14" cy="22" r="1.2" fill="rgba(0,0,0,0.15)"/>
    </svg>
  );
}

export function GolfFlagIcon({ size = 24, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="2" x2="6" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <polygon points="6,2 18,7 6,12" fill={color} opacity="0.9"/>
      <circle cx="6" cy="22" r="2" fill={color} opacity="0.5"/>
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 4L7 10L13 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4L13 10L7 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function CheckIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8L6.5 11.5L13 4.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PinIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1C5.79 1 4 2.79 4 5C4 8 8 15 8 15C8 15 12 8 12 5C12 2.79 10.21 1 8 1Z" fill={color}/>
      <circle cx="8" cy="5" r="1.5" fill="white"/>
    </svg>
  );
}

export function ShareIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="3" r="1.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="13" cy="13" r="1.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="3" cy="8" r="1.5" stroke={color} strokeWidth="1.5"/>
      <line x1="4.5" y1="7" x2="11.5" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4.5" y1="9" x2="11.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function TrophyIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 6H34V26C34 32.627 29.627 37 23 37H25C18.373 37 14 32.627 14 26V6Z" fill={color} opacity="0.9"/>
      <path d="M8 8H14V20C14 20 10 20 8 16C6 12 8 8 8 8Z" fill={color} opacity="0.6"/>
      <path d="M40 8H34V20C34 20 38 20 40 16C42 12 40 8 40 8Z" fill={color} opacity="0.6"/>
      <rect x="20" y="37" width="8" height="5" rx="1" fill={color} opacity="0.7"/>
      <rect x="15" y="42" width="18" height="3" rx="1.5" fill={color} opacity="0.8"/>
    </svg>
  );
}

export function CloseIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L16 16M16 4L4 16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function UserIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="7" r="3.5" stroke={color} strokeWidth="1.8"/>
      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function SearchIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8.5" cy="8.5" r="5" stroke={color} strokeWidth="1.8"/>
      <path d="M13 13L17 17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function PlusIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4v12M4 10h12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function HistoryIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10a7 7 0 1 0 7-7 7 7 0 0 0-5 2L3 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 4v3h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 7v3.5l2.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.32z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.96-.9 6.61-2.45l-3.22-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H1.08v2.6A10 10 0 0 0 10 20z" fill="#34A853"/>
      <path d="M4.4 11.88A5.99 5.99 0 0 1 4.08 10c0-.65.11-1.28.32-1.88V5.52H1.08A10 10 0 0 0 0 10c0 1.62.39 3.15 1.08 4.48l3.32-2.6z" fill="#FBBC05"/>
      <path d="M10 3.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87C14.96.99 12.7 0 10 0A10 10 0 0 0 1.08 5.52l3.32 2.6C5.19 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
    </svg>
  );
}
