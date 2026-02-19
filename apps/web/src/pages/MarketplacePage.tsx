import { useState, useEffect } from 'react';
import { landService } from '@/services/landService';
import { Land, PaginatedResponse } from '@/types';
import { LandCard } from '@/components/land/LandCard';
import { MapPinOff, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export default function MarketplacePage() {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [taskId, setTaskId] = useState('');
  const [taskStatus, setTaskStatus] = useState<{ status: string; result?: any } | null>(null);

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
        
        const data = response.data;
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

  const checkTaskStatus = async () => {
    if (!taskId) return;
    try {
      const response = await landService.getTaskStatus(taskId);
      setTaskStatus(response.data);
    } catch (err) {
      console.error('Failed to check task:', err);
      setTaskStatus({ status: 'ERROR', result: 'Failed to fetch status' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header & Search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Land Marketplace</h1>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search
              }}
            />
          </div>


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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {lands.map((land) => (
                <LandCard key={land.id} land={land} />
              ))}
            </div>

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
