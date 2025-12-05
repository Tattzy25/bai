'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import Image from 'next/image';

/**
 * V1: Floating Button with Modal (Classic)
 * Large floating button with the B logo, opens modal on click
 */
export function SearchWidgetV1() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.hits || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        aria-label="Open search"
      >
        <Image src="/BRIDGIT B POWERED.svg" alt="Bridgit" width={32} height={32} />
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <Image src="/BRIDGIT B POWERED.svg" alt="Bridgit" width={24} height={24} />
                <h2 className="text-xl font-semibold">Search</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b bg-gray-50">
              <div className="relative">
                <Input
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pr-12"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Kbd>Cmd K</Kbd>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-6">
              {loading && <p className="text-center text-gray-500">Searching...</p>}
              {!loading && results.length === 0 && (
                <p className="text-center text-gray-500">
                  {query ? 'No results found' : 'Type to search...'}
                </p>
              )}
              {results.map((result, idx) => (
                <a
                  key={idx}
                  href={result.url}
                  className="block p-4 mb-3 rounded-lg border hover:border-indigo-500 hover:bg-indigo-50 transition"
                >
                  <h3 className="font-semibold text-gray-900">{result.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{result.body}</p>
                  <p className="text-xs text-indigo-600 mt-2">{result.url}</p>
                </a>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
              Powered by Bridgit-AI
            </div>
          </div>
        </div>
      )}
    </>
  );
}
