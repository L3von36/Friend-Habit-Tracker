// src/components/Common/LoomLogo.tsx
import React from 'react';

interface LoomLogoProps {
  className?: string;
}

export const LoomLogo: React.FC<LoomLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v0A2.5 2.5 0 0 0 9.5 7h5A2.5 2.5 0 0 0 17 4.5v0A2.5 2.5 0 0 0 14.5 2z" />
      <path d="M7 8.5c0 .8.4 1.5 1 2 .6.5 1 1.2 1 2s-.4 1.5-1 2c-.6.5-1 1.2-1 2" />
      <path d="M17 8.5c0 .8-.4 1.5-1 2-.6.5-1 1.2-1 2s.4 1.5 1 2c.6.5 1 1.2 1 2" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
      <path d="M9.5 22a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 9.5 17h5a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 14.5 22z" />
    </svg>
  );
};
