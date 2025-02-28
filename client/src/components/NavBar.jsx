import { Link } from "react-router-dom";
import { useUser } from "../hooks/useUser";

export default function NavBar() {
  const user = useUser();

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
            <a href="http://localhost:8000/auth/google">
              <button>Login</button>
            </a>
          ) : (
            <a href="http://localhost:8000/logout">
              <button>Logg ut</button>
            </a>
          )}
        </li>
      </ul>
    </nav>
  );
}
