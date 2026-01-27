'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

type Option = {
    id: string;
    label: string;
    subLabel?: string;
};

type Props = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
};

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    label,
    disabled = false
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerTerm) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(lowerTerm))
        );
    }, [options, searchTerm]);

    const selectedOption = useMemo(() =>
        options.find(o => o.id === value),
        [options, value]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black dark:text-white"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <ul className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <li className="text-gray-500 cursor-default select-none relative py-2 pl-3 pr-9">
                                No results found
                            </li>
                        ) : (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.id}
                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-blue-900 ${value === option.id ? 'bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className={`block truncate ${value === option.id ? 'font-semibold' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                        {option.subLabel && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {option.subLabel}
                                            </span>
                                        )}
                                    </div>

                                    {value === option.id && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-blue-400">
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
