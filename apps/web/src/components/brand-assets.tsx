type IconProps = {
  className?: string;
};

export function HorusLogoMark({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 13.5C17.2 10.3 20.5 8.8 24 8.8C27.5 8.8 30.8 10.3 34 13.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10.5 20.2C13.7 16.8 18.2 15 24 15C29.8 15 34.3 16.8 37.5 20.2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 25.4C15.5 31.1 19.5 34 24 34C28.5 34 32.5 31.1 36 25.4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="24" rx="8.6" ry="6.1" fill="currentColor" opacity="0.18" />
      <ellipse cx="24" cy="24" rx="6.4" ry="4.2" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="2.2" fill="currentColor" />
      <circle cx="24" cy="7.2" r="1.6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function GoalsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <path d="M17.8 6.2L14.7 9.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlansIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 6.5H11L13.4 9H19V17.5H5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 11.4H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 14.6H13.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ExecutionIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.8L6.4 13H11L10.2 20.2L17.6 10.8H13.1L14.1 3.8H12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 15.6V11.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.6V8.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.8 15.6V6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.8 9.1C10.2 7.9 11.2 7.2 12.5 7.2C14.1 7.2 15.2 8.2 15.2 9.5C15.2 10.6 14.7 11.2 13.4 12.1C12.4 12.8 12 13.4 12 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17.3" r="1" fill="currentColor" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M10 6H7.5C6.4 6 5.5 6.9 5.5 8V16C5.5 17.1 6.4 18 7.5 18H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.2 8.2L16 12L12.2 15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.4 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M9.5 6.5L15 12L9.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
