import { useState, useEffect } from 'react';
import { landService } from '@/services/landService';
import { Land, PaginatedResponse } from '@/types';
import { LandCard } from '@/components/land/LandCard';
import { MapPinOff, SearchX, Filter, Search, Map as MapIcon, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { InteractiveMap } from '@/components/map/InteractiveMap';

export default function MarketplacePage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  useEffect(() => {
    const fetchLands = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await landService.search({
          q: searchQuery,
          page,
          page_size: 12
        });
        const data = response.data as unknown as PaginatedResponse<Land>; 
        setLands(data.items);
        setTotalPages(data.total_pages);
      } catch (err) {
        console.error('Failed to fetch lands:', err);
        setError('Failed to load lands. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchLands();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, page]);

  // Convert Land objects to the format InteractiveMap expects
  const mapListings = lands.map(land => ({
    id: land.id,
    location: {
      country: 'Sierra Leone',
      district: land.district,
      chiefdom: land.region,
      community: land.title,
      coordinates: land.location?.latitude && land.location?.longitude ? [land.location.latitude, land.location.longitude] as [number, number] : undefined
    },
    price: land.price || 0,
    size: land.size_sqm,
    sizeUnit: 'sqm' as const,
    purpose: land.classification?.name || 'General',
    verificationScore: land.blockchain_hash ? 100 : 60
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Search & Filter Header */}
      <header className="flex-none h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-20">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Address, Neighborhood, or District"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('split')}
            className={`p-2 rounded-md transition-all ${viewMode === 'split' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Listings */}
        <aside className={`${viewMode === 'map' ? 'hidden' : viewMode === 'list' ? 'w-full' : 'w-[400px] lg:w-[480px]'} flex-none flex flex-col border-r border-slate-200 bg-white overflow-hidden`}>
          <div className="flex-none p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              {lands.length} Properties Found
            </h2>
            <div className="text-sm text-slate-500">
              Sort: <span className="font-medium text-slate-900 cursor-pointer">Newest</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <SearchX className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">Failed to load listings.</p>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'list' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                {lands.map((land) => (
                  <LandCard key={land.id} land={land} />
                ))}

                {lands.length === 0 && (
                  <div className="py-20 text-center col-span-full">
                    <MapPinOff className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Properties Found</h3>
                    <p className="text-sm text-slate-500 px-10">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-4 pb-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Map Area */}
        <main className={`${viewMode === 'list' ? 'hidden' : 'flex-1'} relative bg-slate-100`}>
          <InteractiveMap
            listings={mapListings}
            height="100%"
            showControls={true}
          />
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
