import {
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react';

interface Props
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  value,
  ...props
}: Props) {

  const ref =
    useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    const textarea = ref.current;

    if (!textarea) return;

    textarea.style.height = 'auto';

    textarea.style.height =
      Math.min(textarea.scrollHeight, 300) + 'px';
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  return (
    <div className="space-y-1.5">

      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        value={value}
        onInput={autoResize}
        className={`
          w-full
          min-h-[100px]
          max-h-[300px]
          resize-none
          overflow-y-auto
          rounded-2xl
          border
          border-gray-200
          bg-white
          px-4
          py-3
          text-sm
          text-gray-800
          shadow-sm
          transition-all
          outline-none
          focus:border-teal-500
          focus:ring-4
          focus:ring-teal-100
          disabled:bg-gray-50
          ${error
            ? 'border-red-400 focus:ring-red-100'
            : ''
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}