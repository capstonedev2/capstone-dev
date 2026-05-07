import React from 'react';
import { SYSTEM_LOGO_SRC } from '@/lib/branding';

export function LogoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      src={SYSTEM_LOGO_SRC}
      style={style}
    />
  );
}
