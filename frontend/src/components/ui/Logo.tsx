
export default function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="10" y1="8" x2="10" y2="32"/>
      <line x1="16" y1="8" x2="16" y2="32"/>
      <line x1="22" y1="8" x2="22" y2="32"/>
      <line x1="28" y1="8" x2="28" y2="32"/>
      <line x1="7" y1="30" x2="31" y2="10"/>
    </svg>
  );
}
