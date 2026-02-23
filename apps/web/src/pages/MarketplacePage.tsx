import { useState, useEffect } from 'react';
import { landService } from '@/services/landService';
import { Land, PaginatedResponse } from '@/types';
import { LandCard } from '@/components/land/LandCard';
import { MapPinOff, SearchX, Search, Filter, LayoutGrid, Map as MapIcon, SlidersHorizontal, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';

export default function MarketplacePage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

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

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER SECTION */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 mb-3 px-3 py-1">Verified Registry</Badge>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Land <span className="text-orange-500">Marketplace</span></h1>
              <p className="text-slate-400 mt-2 text-lg">Explore and acquire verified land parcels in Sierra Leone.</p>
           </motion.div>

           <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <MapIcon size={16} /> Map
              </button>
           </div>
        </header>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-3xl p-4 md:p-6 mb-12 shadow-xl sticky top-24 z-40 backdrop-blur-md">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                   placeholder="Search by title, district, or Parcel ID..."
                   className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                 />
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" className="h-14 px-8 border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 rounded-2xl font-bold">
                    <SlidersHorizontal className="w-5 h-5 mr-2" /> Advanced Filters
                 </Button>
                 <Button className="h-14 px-8 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-lg shadow-orange-600/20">
                    Search Now
                 </Button>
              </div>
           </div>
        </div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-32 text-center">
               <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
               <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Querying National Registry...</p>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center bg-red-500/5 border border-red-500/20 rounded-[3rem]">
               <SearchX className="h-16 w-16 text-red-500/50 mx-auto mb-6" />
               <h3 className="text-2xl font-bold text-white mb-2">Connection Issue</h3>
               <p className="text-slate-400 mb-8 max-w-md mx-auto">{error}</p>
               <Button onClick={() => window.location.reload()} className="bg-slate-800 text-white rounded-xl px-10 h-12">Try Again</Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {lands.length === 0 ? (
                <div className="py-32 text-center bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-800">
                   <MapPinOff className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                   <h3 className="text-2xl font-bold text-white mb-2">No parcels found</h3>
                   <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any listings matching your current search parameters.</p>
                   <Button onClick={() => setSearchQuery('')} variant="ghost" className="mt-6 text-orange-500 font-bold hover:bg-orange-500/10">Clear all search terms</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {lands.map((land, idx) => (
                    <motion.div
                      key={land.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <LandCard land={land} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 pt-12 border-t border-slate-800/50">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                    className="h-12 px-6 border-slate-800 bg-slate-900/50 rounded-xl"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Registry Page</span>
                     <span className="bg-orange-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shadow-lg shadow-orange-600/20">{page}</span>
                     <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                    className="h-12 px-6 border-slate-800 bg-slate-900/50 rounded-xl"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-32 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
         National Digital Land Registry • SECURE TRANSFERS • 2024
      </footer>
    </div>
  );
}
