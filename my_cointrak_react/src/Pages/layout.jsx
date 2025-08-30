
import { useContext } from "react";
import{ Link, Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import {
    HomeIcon,
    BookOpenIcon,
    ArrowLeftOnRectangleIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline'; // Import icons

export default function Layout(){
    const {user, token, setUser, setToken } = useContext(AppContext);
    const navigate = useNavigate()

    async function handleLogout(e){
        e.preventDefault()

        const res = await fetch('/api/logout',{
            method:'post',
            headers:{
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json()
        console.log(data);

        if (res.ok) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            navigate('/login');
        }

    }

    // Define navigation items for the sidebar
    const navItems = user ? [
        { name: "Dashboard", href: "/", icon: HomeIcon },
        { name: "Families", href: "/families", icon: UserGroupIcon },
        { name: "Goals", href: "/goals", icon: CalendarDaysIcon },
        { name: "Ledger", href: "/reports", icon: BookOpenIcon },
        { name: "New Post", href: "/create", icon: PlusCircleIcon },
    ] : [
        { name: "Register", href: "/register" },
        { name: "Login", href: "/login" },
    ];


    return (
        <>
        <header className="app-header">
            <nav className="top-nav">
                <Link to="/" className="logo">Cointrak</Link>
                {user ? (
                    <div className="user-info">
                        <p className="text-slate-500 text-sm"> Welcome back, <strong>{user.
                        first_name} {user.last_name}</strong> </p>
                        <form onSubmit={handleLogout}>
                            <button className="nav-link logout-link">
                                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-1" />
                                Logout
                            </button>
                        </form>
                    </div>
                ):(
                <div className="flex items-center space-x-2"> {/* Correctly aligns links horizontally */}
                    <Link to ="/register" className="nav-link">
                    Register
                    </Link>
                    <Link to="/login" className="nav-link">
                    Login
                    </Link>
                </div>
            )}

            </nav>
        </header>

        <div className="flex"> {/* Flex container for sidebar and main content */}
            {user && ( // Only show sidebar if user is logged in
                <aside className="sidebar">
                    <nav className="sidebar-nav">
                        <ul>
                            {navItems.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className="sidebar-nav-link group" // Add group for hover effects
                                    >
                                        {item.icon && <item.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition duration-200 ease-in-out" />}
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
            )}

            <main className={`flex-1 ${user ? 'main-content-with-sidebar' : ''}`}> {/* Conditionally apply class */}
                <Outlet/>
            </main>
        </div>
        </>
    )
}