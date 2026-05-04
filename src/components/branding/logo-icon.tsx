import React from 'react';

export function LogoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Graduation Cap - top diamond */}
      <path
        d="M50 12 L12 34 L50 56 L88 34 Z"
        fill="#003a8f"
      />
      {/* Cap highlight */}
      <path
        d="M50 56 L88 34 L50 42 L12 34 Z"
        fill="#002766"
        opacity="0.4"
      />

      {/* Open Book - bottom */}
      <path
        d="M50 66 L18 54 L18 72 L50 84 Z"
        fill="#003a8f"
      />
      <path
        d="M50 66 L82 54 L82 72 L50 84 Z"
        fill="#00296b"
      />
      {/* Book spine highlight */}
      <line x1="50" y1="66" x2="50" y2="84" stroke="#004ac2" strokeWidth="1.5" />

      {/* Tassel - hanging from center button */}
      <circle cx="50" cy="34" r="3.5" fill="#f6be00" />
      <path
        d="M50 37.5 C58 40, 68 42, 72 54"
        fill="none"
        stroke="#f6be00"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="72" cy="56" r="3" fill="#f6be00" />

      {/* Gold Progress Arc with Arrow */}
      <path
        d="M22 62 C35 78, 60 78, 78 56"
        fill="none"
        stroke="#f6be00"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <polygon
        points="78,52 83,56 76,59"
        fill="#f6be00"
      />
    </svg>
  );
}
