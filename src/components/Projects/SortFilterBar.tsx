/**
 * SortFilterBar Component
 * Controls for sorting and filtering projects
 */

import { ChevronDown } from 'lucide-react';

type SortBy = 'recent' | 'name-asc' | 'name-desc' | 'created' | 'modified';
type FilterBy = 'all' | 'recent' | 'week' | 'month';

interface SortFilterBarProps {
  sortBy: SortBy;
  filterBy: FilterBy;
  onSortChange: (sort: SortBy) => void;
  onFilterChange: (filter: FilterBy) => void;
}

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'created', label: 'Created' },
  { value: 'modified', label: 'Modified' },
];

const filterOptions: { value: FilterBy; label: string }[] = [
  { value: 'all', label: 'All Projects' },
  { value: 'recent', label: 'Recent (7 days)' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export default function SortFilterBar({
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
}: SortFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm font-medium">Sort:</label>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Filter dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm font-medium">Filter:</label>
        <div className="relative">
          <select
            value={filterBy}
            onChange={(e) => onFilterChange(e.target.value as FilterBy)}
            className="appearance-none bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
