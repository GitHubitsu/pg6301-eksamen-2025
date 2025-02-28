import { Outlet } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import SidebarButtons from "./SidebarButtons.jsx";
import { useUser } from "../hooks/useUser.jsx";

export default function Layout() {
  const { user, loading } = useUser();

  if (loading) return <p>Loading user...</p>;

  return (
    <div className="layout">
      <header>
        <NavBar />
      </header>
      <aside className="sidebar">
        <SidebarButtons user={user} />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
