import { Link } from "react-router-dom";
import { useUser } from "../hooks/useUser";

export default function NavBar() {
  const { user } = useUser();

  const API_BASE =
    process.env.NODE_ENV === "production"
      ? "wss://eksamen2025-f502a72af49b.herokuapp.com"
      : "http://localhost:8000";

  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Hjem</Link>
        </li>
        <li>
          <Link to="/about">Om</Link>
        </li>
        <li>
          <Link to="/posts">Innlegg</Link>
        </li>
        {user && (
          <li>
            <Link to="/profile">
              <button>Profil</button>
            </Link>
          </li>
        )}
        <li>
          {!user ? (
            <button
              onClick={() => (window.location.href = `${API_BASE}/auth/google`)}
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => (window.location.href = `${API_BASE}/logout`)}
            >
              Logg ut
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}
