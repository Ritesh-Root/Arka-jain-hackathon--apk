import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`backdrop-blur-2xl bg-white/50 border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(124,58,237,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}
