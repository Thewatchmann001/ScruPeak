import { useState, useEffect } from 'react';
import { landService } from '@/services/landService';
import { Land, PaginatedResponse } from '@/types';
import { ZillowCard } from '@/components/landing/ZillowCard';
import { MapPinOff, Filter, Search, Map as MapIcon, List, Grid, ChevronDown } from 'lucide-react';
import { InteractiveMap } from '@/components/map/InteractiveMap';

export default function MarketplacePage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'list'>('grid');

  useEffect(() => {
    const fetchLands = async () => {
      setLoading(true);
      try {
        const response = await landService.search({
          q: searchQuery,
          page,
          page_size: 12
        });
        const data = response.data as unknown as PaginatedResponse<Land>;
        setLands(Array.isArray(data?.items) ? data.items : []);
        setTotalPages(data?.total_pages || 1);
      } catch (err) {
        console.error('Failed to fetch lands:', err);
        // Don't surface a hard error — just leave the list empty
        setLands([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchLands();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, page]);

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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white overflow-hidden font-sans">
      {/* Search & Header */}
      <div className="flex-none bg-white border-b border-border px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-3xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Address, Neighborhood, or District"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-standard"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-bold text-text hover:bg-surface transition-standard">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Sort:</span>
            <button className="flex items-center gap-1 font-bold text-text hover:text-primary transition-colors">
              Newest <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-surface p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-standard ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-standard ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-standard ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Only visible in non-full-map modes) */}
        {viewMode !== 'map' && (
          <aside className={`${viewMode === 'list' ? 'w-full' : 'w-full lg:w-[600px] xl:w-[700px]'} flex flex-col border-r border-border bg-white overflow-hidden`}>
            <div className="flex-none p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">
                {lands.length} properties found
              </h2>
              {viewMode === 'grid' && (
                 <button onClick={() => setViewMode('map')} className="lg:hidden flex items-center gap-2 text-primary font-bold text-sm">
                   <MapIcon className="w-4 h-4" /> View Map
                 </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#F8F9FA]">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[380px] bg-white border border-border rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`grid ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
                  {lands.map((land) => (
                    <ZillowCard key={land.id} listing={land} />
                  ))}

                  {lands.length === 0 && (
                    <div className="py-24 text-center col-span-full">
                      <MapPinOff className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
                      <h3 className="text-xl font-bold text-text mb-2">No Listings at the Moment</h3>
                      <p className="text-text-secondary max-w-sm mx-auto">
                        {searchQuery
                          ? 'No properties match your search. Try a different keyword or district.'
                          : 'There are no properties listed yet. Check back soon.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2 pb-12">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-border bg-white rounded-lg text-sm font-bold text-text disabled:opacity-50 hover:bg-surface transition-standard"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2 text-sm font-bold text-text-secondary">
                    {page} of {totalPages}
                  </div>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-border bg-white rounded-lg text-sm font-bold text-text disabled:opacity-50 hover:bg-surface transition-standard"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Map (Visible in split mode and map mode) */}
        {(viewMode === 'grid' || viewMode === 'map') && (
           <main className={`flex-1 relative bg-surface ${viewMode === 'grid' ? 'hidden lg:block' : 'block'}`}>
             <InteractiveMap
               listings={mapListings}
               height="100%"
               showControls={true}
             />

             {/* Floating Info Panel (Mock) */}
             <div className="absolute top-4 right-4 z-10 w-80 pointer-events-none">
                {/* Information about active selection would go here */}
             </div>
           </main>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
