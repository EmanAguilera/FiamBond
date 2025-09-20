import { useState, useEffect, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

export default function FamilyLedgersWidget() {
  const { token } = useContext(AppContext);
  const [summaries, setSummaries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFamilySummaries = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/summaries?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Could not fetch family summaries.');
      }

      const data = await res.json();
      setSummaries(Array.isArray(data.data) ? data.data : []);
      const { data: _, ...paginationData } = data;
      setPagination(paginationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getFamilySummaries();
  }, [getFamilySummaries]);

  if (loading) {
    return <p className="text-center py-10">Loading family ledgers...</p>;
  }

  if (error) {
    return <p className="error text-center py-10">{error}</p>;
  }

  return (
    <div>
      {summaries.length > 0 ? (
        <div>
          <div className="space-y-6">
            {summaries.map((summary) => (
              <div key={summary.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-lg mb-3">{summary.name}</h4>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span>Total Inflow:</span>
                    <span className="font-semibold text-green-600">
                      +₱{parseFloat(summary.total_inflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Total Outflow:</span>
                    <span className="font-semibold text-red-500">
                      -₱{parseFloat(summary.total_outflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                  <hr className="border-dashed my-2" />
                  <p className={`flex justify-between font-bold text-base ${summary.net_position >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    <span>Net Position:</span>
                    <span>
                      ₱{parseFloat(summary.net_position).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
                <div className="mt-4">
                  <Link to={`/families/${summary.id}`} className="text-link font-bold text-sm">
                    View Full Ledger &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => getFamilySummaries(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">
                &larr; Previous
              </button>
              <span className="pagination-text">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button onClick={() => getFamilySummaries(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">You are not a member of any families yet.</p>
        </div>
      )}
    </div>
  );
}