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
