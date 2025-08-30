import { useContext, useState } from "react";
import { AppContext } from "../../Context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Create() {
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });

  const [errors, setErrors] = useState({});

  async function handleCreate(e) {
    e.preventDefault();

    // NOTE: When sending multipart/form-data, you should use FormData.
    // However, since your current code sends JSON, I will stick to that.
    // If you were handling file uploads, this would need to change.
    const res = await fetch("/api/posts", {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Assuming you send JSON
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.status === 422) { // Explicitly check for validation status
      setErrors(data.errors);
    } else if (res.ok) {
      navigate("/"); // Or navigate to the new post's page: navigate(`/posts/${data.id}`)
    }
  }

  return (
    <>
      <h1 className="title">Create a New Post</h1>

      {/* Main card container, styled like the other pages */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Post Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              // Consistent input styling
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.title && <p className="error">{errors.title[0]}</p>}
          </div>

          <div>
            <textarea
              rows="6"
              placeholder="Post Content..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              // Consistent textarea styling
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            {errors.body && <p className="error">{errors.body[0]}</p>}
          </div>

          <button type="submit" className="primary-btn">
            Create Post
          </button>
        </form>
      </div>
    </>
  );
}