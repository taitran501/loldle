import React, { useState, useRef, useEffect } from 'react';
import { Champion } from '../types';
import { Search } from 'lucide-react';

interface AutocompleteInputProps {
  champions: Champion[];
  guessedChampionIds: string[];
  onSelectChampion: (champion: Champion) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  champions,
  guessedChampionIds,
  onSelectChampion,
  disabled = false,
  placeholder = 'Type champion name...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter available champions
  const availableChampions = champions.filter(
    c => !guessedChampionIds.includes(c.id)
  );

  const filtered = query.trim() === ''
    ? []
    : availableChampions
        .filter(c => {
          const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
          const nameNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameNorm.includes(q);
        })
        .slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (champ: Champion) => {
    onSelectChampion(champ);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && filtered.length > 0) {
        setIsOpen(true);
      } else {
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && selectedIndex >= 0 && selectedIndex < filtered.length) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto my-4">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim() !== '') setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Round completed!' : placeholder}
          className="w-full bg-[#1e2328] border-2 border-[#785a28]/60 focus:border-[#c8aa6e] text-[#f0e6d2] placeholder-[#a09b8c]/60 px-4 py-3 pl-11 rounded-xl text-base shadow-lg outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c8aa6e]/70" />
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-2 bg-[#1e2328]/95 backdrop-blur border border-[#785a28] rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {filtered.map((champ, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={champ.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(champ)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#c8aa6e]/20 text-[#f0e6d2]' : 'text-[#a09b8c] hover:bg-[#091428]'
                }`}
              >
                <img
                  src={champ.iconUrl}
                  alt={champ.name}
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.id}.png`;
                  }}
                  className="w-9 h-9 rounded-md object-cover border border-[#785a28]/50 flex-shrink-0"
                />
                <span className="font-semibold text-sm text-[#f0e6d2] truncate">
                  {champ.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
