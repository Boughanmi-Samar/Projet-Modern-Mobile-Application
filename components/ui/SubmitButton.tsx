'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
}

export default function SubmitButton({
  children,
  className = '',
  variant = 'primary',
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  let variantClass =
    'bg-[#03c9d7] hover:bg-[#00b5b8] text-white shadow-md shadow-cyan-500/20 active:scale-[0.98]';

  if (variant === 'danger') {
    variantClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.98]';
  } else if (variant === 'secondary') {
    variantClass = 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-[0.98]';
  }

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`min-h-[44px] px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </button>
  );
}
