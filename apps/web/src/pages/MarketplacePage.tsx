import { useState, useEffect, useMemo } from 'react';
import { landService } from '@/services/landService';
import { Land, PaginatedResponse } from '@/types';
import { LandCard } from '@/components/land/LandCard';
import { MapPinOff, SearchX, Map as MapIcon, Grid as GridIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { InteractiveMap } from '@/components/map/InteractiveMap';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');
  const [district, setDistrict] = useState(queryParams.get('district') || '');
  const [landType, setLandType] = useState(queryParams.get('land_type') || '');
  const [purpose, setPurpose] = useState(queryParams.get('purpose') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchLands = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await landService.search({
          q: searchQuery,
          district,
          land_type: landType,
          purpose,
          page,
          page_size: 12
        });
        // Axios wraps response in data
        const data = response.data as unknown as PaginatedResponse<Land>; 
        // Note: Check if response.data is directly the object or if axios wraps it. 
        // Usually axios returns { data: ... }. landService.search returns axios promise.
        
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
  }, [searchQuery, district, landType, purpose, page]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-8">
      <div className="container mx-auto px-4">
        {/* Header & Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Land Marketplace</h1>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <GridIcon className="w-4 h-4" />
                    Grid
                </button>
                <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <MapIcon className="w-4 h-4" />
                    Map
                </button>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by title, location, or description..."
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button
                variant={showFilters ? 'primary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
            >
                <Filter className="w-4 h-4" />
                Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-6 animate-in slide-in-from-top duration-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Freetown"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land Type</label>
                    <select
                        value={landType}
                        onChange={(e) => setLandType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="">All Types</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="agricultural">Agricultural</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="">All Purposes</option>
                        <option value="residential">Build Home</option>
                        <option value="commercial">Business</option>
                        <option value="agricultural">Farming</option>
                    </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                    <button
                        onClick={() => {
                            setDistrict('');
                            setLandType('');
                            setPurpose('');
                            setSearchQuery('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>
          )}


        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <SearchX className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load listings</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
              We're having trouble connecting to the marketplace right now.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-primary-600 font-medium hover:underline text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                    {lands.map((land) => (
                        <LandCard key={land.id} land={land} onSelect={(id) => navigate(`/land/${id}`)} />
                    ))}
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <InteractiveMap
                        listings={lands.map(l => ({
                            id: l.id || '',
                            location: {
                                country: 'Sierra Leone',
                                district: l.district || '',
                                chiefdom: '',
                                community: l.region || '',
                                coordinates: l.latitude && l.longitude ? [l.latitude, l.longitude] : undefined
                            },
                            price: Number(l.price) || 0,
                            size: Number(l.size_sqm) || 0,
                            sizeUnit: 'sqm',
                            purpose: 'Land',
                            verificationScore: l.blockchain_verified ? 100 : 65
                        }))}
                        onListingClick={(id) => navigate(`/land/${id}`)}
                        height="calc(100vh - 350px)"
                    />
                </div>
            )}

            {lands.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                {searchQuery ? (
                  <>
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                      <SearchX className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      We couldn't find any lands matching "{searchQuery}". Try adjusting your search terms or filters.
                    </p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-6 text-primary-600 font-medium hover:underline"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-100 p-6 rounded-full mb-6">
                      <MapPinOff className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Lands Listed Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                      There are currently no land listings available in the marketplace. Check back soon or be the first to list a property!
                    </p>
                    <Link to="/sell">
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        List Your Land
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
