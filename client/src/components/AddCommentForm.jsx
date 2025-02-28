import { useState, useEffect } from "react";

export default function AddCommentForm({ onAddComment }) {
  const [nameText, setNameText] = useState("");
  const [commentText, setCommentText] = useState("");

  return (
    <div className="comment-box">
      <h3>Skriv en kommentar</h3>
      <ul>
        <li>
          <label>
            Navn:
            <br />
            <input
              type="text"
              value={nameText}
              onChange={(e) => setNameText(e.target.value)}
            />
          </label>
        </li>
        <li>
          <label>
            Kommentar:
            <br />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </label>
        </li>
        <li>
          <button
            onClick={() => {
              onAddComment({ nameText, commentText });
              setNameText("");
              setCommentText("");
            }}
          >
            Lagre kommentar
          </button>
        </li>
      </ul>
    </div>
  );
}
