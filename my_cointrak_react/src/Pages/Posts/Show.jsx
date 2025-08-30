import { useContext, useEffect, useState, useCallback } from "react"; // 1. Import useCallback
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";

export default function Show() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AppContext);

  const [post, setPost] = useState(null);

  // 2. Wrap getPost in useCallback. It depends on `id`.
  const getPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${id}`);
    const data = await res.json();

    if (res.ok) {
      setPost(data.post);
    }
  }, [id]); // 3. Add `id` as its dependency.

  async function handleDelete(e) {
    e.preventDefault();

    if (user && post && user.id === post.user_id) { // Added a check for post
      const res = await fetch(`/api/posts/${id}`, {
        method: "delete",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        navigate("/");
      }
    }
  }

  useEffect(() => {
    getPost();
  }, [getPost]); // 4. Add the stable `getPost` to the dependency array.

  return (
    <>
      {post ? (
        <div
          key={post.id}
          className="mt-4 p-4 border rounded-md border-dashed border-slate-400"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h2 className="font-bold text-2xl">{post.title}</h2>
              <small className="text-xs text-slate-600">
                Created by {post.user.name} on{" "}
                {new Date(post.created_at).toLocaleTimeString()}
              </small>
            </div>
          </div>
          <p>{post.body}</p>

          {user && user.id === post.user_id && (
            <div className="flex items-center justify-end gap-4">
              <Link
                to={`/posts/update/${post.id}`}
                className="bg-green-500 text-white text-sm rounded-lg px-3 py-1"
              >
                Update
              </Link>

              <form onSubmit={handleDelete}>
                <button className="bg-red-500 text-white text-sm rounded-lg px-3 py-1">
                  Delete
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <p className="title">Post not found!</p>
      )}
    </>
  );
}