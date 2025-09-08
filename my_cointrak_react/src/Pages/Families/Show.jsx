import { useContext, useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom"; // <-- Make sure Link is imported
import { AppContext } from "../../Context/AppContext";

export default function Show() {
    const { token } = useContext(AppContext);
    const { id } = useParams();
    const [family, setFamily] = useState(null);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const getFamily = useCallback(async () => {
        const res = await fetch(`/api/families/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        if (res.ok) {
            setFamily(data);
        }
    }, [token, id]);

    async function handleAddMember(e) {
        e.preventDefault();
        setMessage("");
        setErrors({});

        const res = await fetch(`/api/families/${id}/members`, {
            method: "post",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email: newMemberEmail }),
        });

        const data = await res.json();

        if (res.status === 422) {
            if (data.errors) {
                setErrors(data.errors);
            } else {
                setMessage(data.message || "An error occurred.");
            }
        } else if (res.ok) {
            setFamily(data);
            setNewMemberEmail("");
            setMessage("Member added successfully!");
        }
    }

    useEffect(() => {
        if (token && id) {
            getFamily();
        }
    }, [getFamily, token, id]);

    const isSuccessMessage = message === "Member added successfully!";

    return (
        <>
            <h1 className="title">Family Details</h1>

            {family ? (
                <>
                    {/* Add Member Card */}
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
                                {errors.email && <p className="error">{errors.email[0]}</p>}
                                {message && (
                                    <p className={`mt-2 text-sm ${isSuccessMessage ? 'text-green-600' : 'text-red-600'}`}>
                                        {message}
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="primary-btn">
                                Add Member
                            </button>
                        </form>
                    </div>

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

                        {/* --- START OF FIX --- */}
                        <div className="mt-6 text-center">
                            <Link
                                to={`/families/${family.id}/ledger`}
                                className="text-link font-bold"
                            >
                                View Family Ledger &rarr;
                            </Link>
                        </div>
                        {/* --- END OF FIX --- */}
                    </div>
                </>
            ) : (
                <p className="text-center">Loading family details...</p>
            )}
        </>
    );
}