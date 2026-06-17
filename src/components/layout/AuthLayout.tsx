import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
    {/* Dot pattern background */}
    <div
      className="absolute inset-0 opacity-20 dot-bg"
      aria-hidden
    />

    {/* Noise overlay */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
      }}
      aria-hidden
    />

    {/* Glow orbs */}
    <div
      className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-[128px] opacity-20"
      style={{ background: 'radial-gradient(circle, #16a34a, transparent)' }}
      aria-hidden
    />
    <div
      className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full blur-[96px] opacity-15"
      style={{ background: 'radial-gradient(circle, #0d9488, transparent)' }}
      aria-hidden
    />

    <div className="relative z-10 w-full max-w-sm px-4 py-8">
      <Outlet />
    </div>
  </div>
);
