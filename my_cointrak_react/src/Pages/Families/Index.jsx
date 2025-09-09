import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

export default function Families() {
  const { token } = useContext(AppContext);
  const [families, setFamilies] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [listError, setListError] = useState(null); // Separate error for the list

  const getFamilies = useCallback(async () => {
    setListError(null); // Clear previous list errors
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Handle failure to fetch the list of families
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message || "Could not load your families. Please try refreshing the page.";
        setListError(message);
        return;
      }

      const data = await res.json();
      setFamilies(data);

    } catch (error) {
      console.error('Failed to fetch families:', error);
      setListError('A network error occurred while fetching your families.');
    }
  }, [token]);

  async function handleCreateFamily(e) {
    e.preventDefault();
    // Clear all previous form errors
    setErrors({});
    setGeneralError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ first_name: familyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          // Handle validation errors (e.g., name is empty)
          setErrors(data.errors);
        } else {
          // Handle all other server errors (500, 401, etc.)
          const message = data.message || "Failed to create the family. Please try again.";
          setGeneralError(message);
        }
        return; // Stop execution
      }

      // On success
      setFamilies([...families, data]);
      setFamilyName(""); // Clear the input field

    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection and try again.');
    }
  }

  useEffect(() => {
    if (token) {
      getFamilies();
    }
  }, [getFamilies, token]);

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

          <button type="submit" className="primary-btn">
            Create Family
          </button>
        </form>
      </div>

      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Families</h2>

        {listError && <p className="error mb-4">{listError}</p>}

        {!listError && families.length > 0 ? (
          <div className="space-y-3">
            {families.map((family) => (
              <div
                key={family.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center transition duration-200 ease-in-out hover:bg-gray-100"
              >
                <h3 className="font-semibold text-lg text-gray-700">{family.first_name}</h3>
                <Link
                  to={`/families/${family.id}`}
                  className="bg-indigo-600 text-white text-sm rounded-md px-4 py-2 hover:bg-indigo-700 transition duration-200 ease-in-out"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        ) : (
          !listError && <p className="text-gray-600 italic">You are not a part of any family yet.</p>
        )}
      </div>
    </>
  );
}