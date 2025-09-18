import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import FamilyListItem from "../Components/FamilyListItems.jsx";

export default function Families() {
  const { token } = useContext(AppContext);
  const [families, setFamilies] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [listError, setListError] = useState(null);

  const getFamilies = useCallback(async (page = 1) => {
    setListError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not load your families.");
      }
      const data = await res.json();
      setFamilies(data.data);
      const { data: _, ...paginationData } = data;
      setPagination(paginationData);
    } catch (error) {
      console.error('Failed to fetch families:', error);
      setListError('A network error occurred while fetching your families.');
    }
  }, [token]);

  async function handleCreateFamily(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        method: "post",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ first_name: familyName }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 422) setErrors(data.errors);
        else setGeneralError(data.message || "Failed to create the family.");
        return;
      }
      getFamilies(1);
      setFamilyName("");
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
    }
  }

  useEffect(() => {
    if (token) {
      getFamilies();
    }
  }, [getFamilies, token]);

  function handleFamilyUpdated(updatedFamily) {
    setFamilies(families.map(f => (f.id === updatedFamily.id ? updatedFamily : f)));
  }

  // --- THIS IS THE CORRECTED FUNCTION ---
  // The unused 'deletedFamilyId' parameter has been removed to fix the ESLint error.
  function handleFamilyDeleted() {
    const currentPage = pagination?.current_page || 1;
    const isLastItemOnPage = families.length === 1 && currentPage > 1;
    const pageToFetch = isLastItemOnPage ? currentPage - 1 : currentPage;
    
    getFamilies(pageToFetch);
  }

  return (
    <>
      <h1 className="title">Manage Your Families</h1>

      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Create a New Family</h2>
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Family Name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.first_name && <p className="error">{errors.first_name[0]}</p>}
          </div>
          {generalError && <p className="error">{generalError}</p>}
          <button type="submit" className="primary-btn">Create Family</button>
        </form>
      </div>

      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Families</h2>
        {listError && <p className="error mb-4">{listError}</p>}
        {!listError && families.length > 0 ? (
          <div className="space-y-3">
            {families.map((family) => (
              <FamilyListItem
                key={family.id}
                family={family}
                onFamilyUpdated={handleFamilyUpdated}
                onFamilyDeleted={handleFamilyDeleted}
              />
            ))}
          </div>
        ) : (
          !listError && <p className="text-gray-600 italic">You are not a part of any family yet.</p>
        )}
        {pagination && pagination.last_page > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => getFamilies(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="secondary-btn disabled:opacity-50"
            >
              &larr; Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => getFamilies(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="secondary-btn disabled:opacity-50"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </>
  );
}