import { useEffect, useState } from "react";
import { useUser } from "../hooks/useUser";
import axios from "axios";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const [userPosts, setUserPosts] = useState([]);
  const { user, loading } = useUser();

  useEffect(() => {
    if (!user) return;

    async function fetchUserPosts() {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/posts/byUser/${user.googleId}`,
          { withCredentials: true },
        );
        setUserPosts(response);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    }

    fetchUserPosts();
  }, [user]);

  if (loading) return <p>Laster profil...</p>;
  if (!user) return <p>Ikke innlogget.</p>;

  return (
    <div>
      <h1>Profil</h1>
      <p>Velkommen, {user.displayName}!</p>
      {user.verified ? (
        <>
          <h2>Dine innlegg</h2>
          {userPosts.length > 0 ? (
            <ul className="cards">
              {userPosts.map((post) => {
                const createdAt = new Date(post.createdAt);
                const month = createdAt.toLocaleString("en-US", {
                  month: "short",
                });
                const date = createdAt.getDate();
                return (
                  <li className="card" key={post._id}>
                    <Link to={`/posts/${post.name}`}>
                      <time className="time" dateTime={createdAt.toISOString()}>
                        <div className="month">{month}</div>
                        <div className="date">{date}</div>
                      </time>
                      <h2>{post.title}</h2>
                      <div className="meta">
                        <span>Skrevet av {post.postedBy}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Du har ikke opprettet noen innlegg enda.</p>
          )}
        </>
      ) : (
        <div>
          <p>Du er ikke verifisert enda. Du kan ikke opprette innlegg.</p>
          <button
            onClick={async () => {
              try {
                await axios.post(
                  "http://localhost:8000/api/verify",
                  {},
                  { withCredentials: true },
                );
                window.location.reload();
              } catch (error) {
                console.error("Feil ved verifisering av bruker:", error);
              }
            }}
          >
            Verifisere konto
          </button>
        </div>
      )}
    </div>
  );
}
