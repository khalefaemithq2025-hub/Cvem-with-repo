import React, { useState, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  /** Visual theme values passed from Header to avoid re-deriving */
  inputBg: string;
  inputBorder: string;
  iconColor: string;
  isLight: boolean;
  /** Optional: seed the query from outside (e.g. mobile re-open) */
  initialQuery?: string;
  /** Called after a successful navigation so parent can close mobile menu */
  onSearch?: (query: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SearchBar({
  inputBg,
  inputBorder,
  iconColor,
  isLight,
  initialQuery = '',
  onSearch,
  className,
  style,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
      onSearch?.(trimmed);
    },
    [query, navigate, onSearch],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setQuery(''); inputRef.current?.blur(); }
  };

  const clear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const focusRing = focused
    ? `0 0 0 3px ${isLight ? 'rgba(59,130,246,0.12)' : 'rgba(0,176,255,0.10)'}`
    : 'none';

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {/* Search icon — clickable to submit */}
      <button
        type="submit"
        tabIndex={-1}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <Search style={{ width: 18, height: 18, color: iconColor }} />
      </button>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="ابحث عن منتج..."
        style={{
          width: '100%',
          paddingRight: 36,
          paddingLeft: query ? 32 : 12,
          paddingTop: 9,
          paddingBottom: 9,
          borderRadius: 10,
          outline: 'none',
          fontFamily: 'Tajawal, sans-serif',
          fontSize: '0.9rem',
          border: `1px solid ${focused
            ? (isLight ? 'rgba(59,130,246,0.5)' : 'rgba(0,176,255,0.5)')
            : inputBorder
          }`,
          background: inputBg,
          color: isLight ? '#0d3a6e' : '#fff',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focusRing,
          direction: 'rtl',
        }}
      />

      {/* Clear button — visible only when there is text */}
      {query && (
        <button
          type="button"
          onClick={clear}
          tabIndex={-1}
          style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            display: 'flex', alignItems: 'center',
            color: isLight ? '#94a3b8' : 'rgba(147,216,255,0.45)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = isLight ? '#64748b' : 'rgba(147,216,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = isLight ? '#94a3b8' : 'rgba(147,216,255,0.45)')}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      )}
    </form>
  );
}
