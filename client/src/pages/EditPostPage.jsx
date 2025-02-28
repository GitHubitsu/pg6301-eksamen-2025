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

  useEffect(() => {
    if (!user) return;

    async function fetchPost() {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/posts/${name}`,
          {
            withCredentials: true,
          },
        );

        const postData = response.data;

        // ✅ Ensure only the post owner can edit
        if (postData.postedById !== user.googleId) {
          alert("You can only edit your own posts.");
          navigate("/posts");
          return;
        }

        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content.join("\n")); // Join array into text
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    }

    fetchPost();
  }, [user, name, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    // ✅ Validation: Ensure title & content meet the criteria
    if (
      !title.trim() ||
      content.trim().split(/\s+/).length < 10 ||
      content.length > 1000
    ) {
      alert("Post must have at least 10 words and not exceed 1000 characters.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:8000/api/posts/${name}`,
        {
          title,
          content: content.split("\n"), // Convert text to array
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        alert("Post updated successfully!");
        navigate(`/posts/${name}`);
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Could not update post.");
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
