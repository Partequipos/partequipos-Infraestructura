import React, { useEffect, useId, useRef, useState } from 'react';

export interface DashboardMultiSelectOption {
  value: string;
  label: string;
}

interface DashboardMultiSelectProps {
  label: string;
  options: DashboardMultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  emptyLabel?: string;
  className?: string;
}

const sortByLabel = (values: string[], options: DashboardMultiSelectOption[]): string[] => {
  const labelByValue = new Map(options.map((option) => [option.value, option.label]));
  return [...values].sort((left, right) =>
    (labelByValue.get(left) ?? left).localeCompare(labelByValue.get(right) ?? right, 'es', {
      sensitivity: 'base',
    })
  );
};

const buildSummary = (
  selectedValues: string[],
  options: DashboardMultiSelectOption[],
  allLabel: string,
  emptyLabel: string
): string => {
  if (selectedValues.length === 0) return allLabel;
  if (selectedValues.length === 1) {
    return options.find((option) => option.value === selectedValues[0])?.label ?? emptyLabel;
  }
  return `${selectedValues.length} seleccionados`;
};

export const DashboardMultiSelect: React.FC<DashboardMultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  allLabel = 'Todos',
  emptyLabel = 'Sin opciones',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange(sortByLabel([...selectedValues, value], options));
  };

  const summary = buildSummary(selectedValues, options, allLabel, emptyLabel);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label className="block text-xs font-medium text-[#50504f] mb-0.5">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="w-full min-h-0 py-1.5 px-2.5 text-left text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cf1b22]/60"
      >
        <span className="block truncate">{summary}</span>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
        >
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-xs font-medium text-[#cf1b22] hover:bg-red-50 border-b border-gray-100"
            onClick={() => onChange([])}
          >
            {allLabel}
          </button>
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">{emptyLabel}</p>
          ) : (
            options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                    className="rounded border-gray-300 text-[#cf1b22] focus:ring-[#cf1b22] h-3.5 w-3.5"
                  />
                  <span className="truncate" title={option.label}>
                    {option.label}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
