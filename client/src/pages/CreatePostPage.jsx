import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import axios from "axios";

export default function CreatePostPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  function countWords(text) {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const wordCount = countWords(content);

    if (wordCount < 10) {
      setError("Innlegg må inneholde minst 10 ord.");
      return;
    }
    if (content.length > 1000) {
      setError("Innlegg kan ikke overstige 1000 tegn.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/posts`,
        {
          title,
          content,
          postedBy: user.displayName,
          postedById: user.googleId,
        },
        { withCredentials: true },
      );

      if (response.status === 201) {
        alert("Innlegget ble opprettet!");
        setTimeout(() => navigate("/posts"), 2000);
      }
    } catch (error) {
      setError(
        "Feil ved oppretting av innlegg: " + error.response?.data?.error,
      );
    }
  }

  if (!user || !user.verified) {
    return (
      <p>
        Tilgang avslått. Du må være en verifisert bruker for å opprette et
        innlegg.
      </p>
    );
  }

  return (
    <div className="new-content">
      <h2>Opprett nytt innlegg</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Tittel:
          <br />
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
          <br />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={1000}
          />
        </label>
        <p>{countWords(content)} ord (minst 10)</p>
        <p>{content.length} / 1000 tegn</p>
        <br />
        {error && <p style={{ color: "red" }}>{error}</p>}{" "}
        <button
          type="submit"
          disabled={countWords(content) < 10 || content.length > 1000}
        >
          Opprett Innlegg
        </button>
      </form>
    </div>
  );
}
