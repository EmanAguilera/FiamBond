import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [posts, setPosts] = useState([]); // Added state for posts
  const { user, token } = useContext(AppContext);

  // Function to fetch the latest posts
  const getPosts = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/posts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        console.error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [token]);

  const getTransactions = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setTransactions(data);
        const total = data.reduce((acc, transaction) => {
          if (transaction.type === 'income') {
            return acc + parseFloat(transaction.amount);
          }
          return acc - parseFloat(transaction.amount);
        }, 0);
        setBalance(total);
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [token]);

  useEffect(() => {
    // Only fetch data if the user is logged in
    if (token) {
      getTransactions();
      getPosts(); // Fetch posts when the user is logged in
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setBalance(0);
      setPosts([]); // Clear posts on logout
    }
  }, [token, getTransactions, getPosts]);

  return (
    <>
      {/* --- CONDITIONAL RENDERING --- */}
      {/* If user is logged in, show the Dashboard. Otherwise, show the Introduction. */}
      
      {user ? (
        // --- FINANCIAL DASHBOARD SECTION (For Logged-in Users) ---
        <div className="dashboard-section">
          <div className="dashboard-header">
            <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
            <Link to="/transactions/create" className="primary-btn max-w-[200px]">
              + Add Transaction
            </Link>
          </div>
          
          <div className="dashboard-card text-center mb-8">
            <p className="text-lg text-slate-600 mb-2">Current Balance</p>
            <p className={`balance-amount ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Recent Transactions</h3>
          {transactions.length > 0 ? (
            <div className="dashboard-card p-0 mb-12">
                {transactions.slice(0, 5).map((transaction) => (
                <div
                    key={transaction.id}
                    className="transaction-item border-b last:border-b-0 border-gray-100"
                >
                    <div>
                        <p className="transaction-description">{transaction.description}</p>
                        <small className="transaction-date">
                            {new Date(transaction.created_at).toLocaleDateString()}
                        </small>
                    </div>
                    <p className={`transaction-amount ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mb-12">You have no personal transactions yet.</p>
          )}

          {/* --- LATEST POSTS SECTION (For Logged-in Users) --- */}
          <h3 className="font-bold text-2xl text-gray-800 mb-6">Latest Posts</h3>
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="mb-4 p-4 border rounded-md border-dashed border-slate-400"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-2xl">{post.title}</h2>
                    <small className="text-xs text-slate-600">
                      Created by {post.user.name} on{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <Link
                    to={`/posts/${post.id}`}
                    className="primary-btn text-sm"
                  >
                    Read more
                  </Link>
                </div>
                <p>{post.body}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">There are no posts to display.</p>
          )}
        </div>
      ) : (
        // --- INTRODUCTION / HERO SECTION (For Logged-out Visitors) ---
        <div className="text-center py-24">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Take Control of Your Finances
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Cointrak is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.
          </p>
          <div className="flex justify-center items-center gap-4">
            <Link to="/register" className="primary-btn w-auto px-8 py-3">
              Get Started for Free
            </Link>
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition">
              Login to your account
            </Link>
          </div>
        </div>
      )}
    </>
  );
}