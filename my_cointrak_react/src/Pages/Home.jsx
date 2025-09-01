// src/Pages/Home.jsx

import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [posts, setPosts] = useState([]);
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
    if (token) {
      getTransactions();
      getPosts();
    } else {
      setTransactions([]);
      setBalance(0);
      setPosts([]);
    }
  }, [token, getTransactions, getPosts]);

  return (
    <>
      {user ? (
        // --- FINANCIAL DASHBOARD SECTION (For Logged-in Users) ---
        // This is now inside the <main> tag which has its own padding
        <div className="p-10">
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

            {/* --- UPDATED LATEST POSTS SECTION --- */}
            <h3 className="font-bold text-2xl text-gray-800 mb-6">Latest Posts</h3>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white border border-gray-200 rounded-lg shadow-md p-6 flex flex-col justify-between">
                    <div>
                      <h2 className="font-bold text-2xl mb-2">{post.title}</h2>
                      <small className="text-sm text-gray-500 mb-4 block">
                        Created by {post.user.name} on{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </small>
                      <p className="text-gray-700">
                        {/* Truncate post body to show a preview */}
                        {post.body.substring(0, 120)}...
                      </p>
                    </div>
                    <div className="mt-6">
                      <Link to={`/posts/${post.id}`} className="text-link font-bold">
                        Read more &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">There are no posts to display.</p>
            )}
          </div>
        </div>
      ) : (
        // --- ENHANCED INTRODUCTION / HERO SECTION (For Logged-out Visitors) ---
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-headline">
                Take Control of Your Finances
              </h1>
              <p className="hero-subheadline">
                Cointrak is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="primary-btn w-auto text-lg">
                  Get Started for Free
                </Link>
                <Link to="/login" className="text-link text-lg">
                  Login to your account
                </Link>
              </div>
            </div>

            <div className="hero-visual">
              <img 
                src="/CoinTrak_Image.png" 
                alt="A family happily managing their finances on a tablet with an overlay of financial charts"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}