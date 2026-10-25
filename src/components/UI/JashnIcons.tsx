import React from 'react';
import type { IconProps } from './iconTypes';

export type { IconProps };

export function IconSparkles({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M19 2L19.8 4.2L22 5L19.8 5.8L19 8L18.2 5.8L16 5L18.2 4.2L19 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconTimeline({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="5"
        cy="6"
        r="3"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="19"
        cy="6"
        r="3"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="12"
        cy="18"
        r="3"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 6H16M6.5 8.5L10.5 15.5M17.5 8.5L13.5 15.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCompass({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <polygon
        points="12,7 15,12 12,17 9,12"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon points="12,7 15,12 12,12" fill="currentColor" />
    </svg>
  );
}

export function IconShieldBolt({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 5V11C4 16.5 7.4 21.6 12 23C16.6 21.6 20 16.5 20 11V5L12 2Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 7L9 12.5H13.5L11.5 17L15 11.5H10.5L12.5 7Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function IconScale({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3V21M6 21H18M4 7L8 14H2L6 7ZM18 7L22 14H16L18 7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="8,14 2,14 5,16" fill="currentColor" fillOpacity="0.3" />
      <polygon points="22,14 16,14 19,16" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function IconAlertShield({ className = 'w-4 h-4' }: IconProps): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 6V11.5C4 16.8 7.4 21.8 12 23C16.6 21.8 20 16.8 20 11.5V6L12 2Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export * from './JashnFeatureIcons';
