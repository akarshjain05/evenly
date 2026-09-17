import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field text-left flex items-center justify-between w-full h-[48px] cursor-pointer"
        style={{ paddingRight: '13px', backgroundImage: 'none' }} 
      >
        <span className={`truncate ${!selectedOption ? 'text-ink-soft' : 'text-ink'}`}>
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        <ChevronDown size={20} className={`text-ink-soft shrink-0 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-paper border border-line-dark rounded-[10px] shadow-lg max-h-60 overflow-y-auto py-1 animate-fade-in origin-top">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-[13px] py-2.5 text-[15px] hover:bg-bg transition-colors cursor-pointer ${
                option.value === value ? 'bg-bg font-medium text-primary' : 'text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
