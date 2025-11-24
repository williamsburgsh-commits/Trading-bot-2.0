'use client';

import { FilterOptions } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SignalsFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  assets: string[];
}

export function SignalsFilter({ onFilterChange, assets }: SignalsFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
    setOpenDropdown(null);
  };

  const statusOptions = ['active', 'filled', 'closed'];
  const assetTypeOptions = ['crypto', 'forex'];
  const signalTypeOptions = ['BUY', 'SELL'];

  const FilterDropdown = ({
    label,
    filterKey,
    options,
  }: {
    label: string;
    filterKey: keyof FilterOptions;
    options: string[];
  }) => (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          setOpenDropdown(openDropdown === filterKey ? null : filterKey)
        }
        className="gap-2"
      >
        {label}
        {filters[filterKey] && (
          <span className="text-xs bg-primary text-primary-foreground rounded px-2 py-0.5">
            {filters[filterKey]}
          </span>
        )}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {openDropdown === filterKey && (
        <div className="absolute top-full mt-1 z-50 min-w-[150px] rounded-md border border-border bg-card shadow-md">
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => handleFilterChange(filterKey, undefined)}
          >
            Clear Filter
          </button>
          <div className="border-t border-border" />
          {options.map((option) => (
            <button
              key={option}
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-muted',
                filters[filterKey] === option && 'bg-muted font-medium'
              )}
              onClick={() => handleFilterChange(filterKey, option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={dropdownRef}
      className="flex flex-wrap gap-2 items-center p-4 bg-card border border-border rounded-lg"
    >
      <span className="text-sm font-medium text-muted-foreground">
        Filters:
      </span>
      <FilterDropdown
        label="Status"
        filterKey="status"
        options={statusOptions}
      />
      <FilterDropdown
        label="Asset"
        filterKey="asset"
        options={assets}
      />
      <FilterDropdown
        label="Type"
        filterKey="assetType"
        options={assetTypeOptions}
      />
      <FilterDropdown
        label="Signal"
        filterKey="signalType"
        options={signalTypeOptions}
      />

      {Object.keys(filters).length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFilters({});
            onFilterChange({});
          }}
          className="ml-auto"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
