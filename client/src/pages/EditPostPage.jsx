import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import axios from "axios";

export default function EditPostPage() {
  const { name } = useParams(); // Get the post name from the URL
  const navigate = useNavigate();
  const { user, loading } = useUser();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!user) return;

    async function fetchPost() {
      try {
        const response = await axios.get(`${API_URL}/api/posts/${name}`, {
          withCredentials: true,
        });

        const postData = response.data;

        if (postData.postedById !== user.googleId) {
          alert("You can only edit your own posts.");
          setTimeout(() => navigate("/posts"), 2000);
          return;
        }

        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content.join("\n"));
      } catch (error) {
        console.error("Kunne ikke laste innlegget:", error);
      }
    }

    fetchPost();
  }, [user, name, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !title.trim() ||
      content.trim().split(/\s+/).length < 10 ||
      content.length > 1000
    ) {
      alert("Innlegget må ha minst 10 ord og ikke overstige 1000 tegn.");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/posts/${name}`,
        {
          title,
          content: content.split("\n"), // Convert text to array
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        alert("Innlegget ble oppdatert!");
        setTimeout(() => navigate(`/posts/${name}`), 2000);
      }
    } catch (error) {
      alert("Kunne ikke oppdatere innlegget.");
    }
  }

  if (loading) return <p>Laster innlegg...</p>;
  if (!user) return <p>Tilgang avslått. Vennligst logg inn.</p>;
  if (!post) return <p>Innelgg ikke funnet.</p>;

  return (
    <div>
      <h2>Redigere Innlegg</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Tittel:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Innhold:
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Lagre</button>
      </form>
    </div>
  );
}
