import { useContext, useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";

// Define the limit on the frontend as well, so it's consistent with the backend.
const MAX_MEMBERS_PER_FAMILY = 10;
export default function Show() {

    const { token } = useContext(AppContext);
    const { id } = useParams();
    const [family, setFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState(null); // For fetching the family
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [formErrors, setFormErrors] = useState({}); // For validation errors
    const [formMessage, setFormMessage] = useState({ type: '', text: '' }); // For success/general error messages

    const getFamily = useCallback(async () => {
        setLoading(true);
        setLoadingError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const message = errorData?.message || "Could not load family details.";
                setLoadingError(message);
                setLoading(false);
                return;
            }

            const data = await res.json();
            setFamily(data);
        } catch (err) {
            console.error('Failed to fetch family:', err);
            setLoadingError("A network error occurred. Please try again later.");
        }
        setLoading(false);
    }, [token, id]);

    async function handleAddMember(e) {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setFormErrors({});

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${id}/members`, {
                method: "post",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email: newMemberEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 422) {
                    setFormErrors(data.errors);
                } else {
                    // For other errors like user not found (404) or server error (500)
                    setFormMessage({ type: 'error', text: data.message || "Failed to add member." });
                }
                return;
            }

            // On success
            setFamily(data); // The API returns the updated family object
            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });

        } catch (err) {
            console.error('Failed to add member:', err);
            setFormMessage({ type: 'error', text: 'A network error occurred. Please check your connection.' });
        }
    }

    useEffect(() => {
        if (token && id) {
            getFamily();
        }
    }, [getFamily, token, id]);

    if (loading) {
        return <p className="text-center">Loading family details...</p>;
    }

    if (loadingError) {
        return <p className="error text-center">{loadingError}</p>;
    }

    return (
        <>
            <h1 className="title">Family Details</h1>

            {family && (
                <>
                    {/* --- START OF THE FIX: CONDITIONAL RENDERING --- */}
                    {/* Only show the "Add Member" card if the member count is BELOW the limit. */}
                    {family.members.length < MAX_MEMBERS_PER_FAMILY ? (
                        <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
                            <h2 className="font-bold text-xl mb-4 text-gray-800">Add Member to "{family.first_name}"</h2>
                            <form onSubmit={handleAddMember} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        placeholder="New Member's Email"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {formErrors.email && <p className="error">{formErrors.email[0]}</p>}
                                    {formMessage.text && (
                                        <p className={`mt-2 text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                            {formMessage.text}
                                        </p>
                                    )}
                                </div>
                                <button type="submit" className="primary-btn">Add Member</button>
                            </form>
                        </div>
                    ) : (
                        // If the limit is reached, show a message instead of the form.
                        <div className="w-full max-w-3xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-md shadow-md mb-8">
                            <p className="font-bold">Member Limit Reached</p>
                            <p>This family cannot have more than {MAX_MEMBERS_PER_FAMILY} members.</p>
                        </div>
                    )}
                    {/* --- END OF THE FIX --- */}

                    {/* Family Members Card */}
                    <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
                        <h2 className="font-bold text-xl mb-4 text-gray-800">Family Members</h2>
                        {family.members && family.members.length > 0 ? (
                            <div className="space-y-3">
                                {family.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="p-4 bg-gray-50 border border-gray-200 rounded-md transition duration-200 ease-in-out hover:bg-gray-100"
                                    >
                                        <h3 className="font-semibold text-lg text-gray-700">{member.full_name}</h3>
                                        <p className="text-sm text-gray-500">{member.email}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 italic">No members have been added to this family yet.</p>
                        )}

                        <div className="mt-6 text-center">
                            <Link
                                to={`/families/${family.id}/ledger`}
                                className="text-link font-bold"
                            >
                                View Family Ledger &rarr;
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}