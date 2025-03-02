import { useEffect, useState, useRef } from "react";
import { useUser } from "../hooks/useUser.jsx";

const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const WS_URL =
  process.env.NODE_ENV === "production"
    ? "wss://eksamen2025-f502a72af49b.herokuapp.com"
    : "ws://localhost:8000/";

export default function Emojis({ postName }) {
  const [reactionCounts, setReactionCounts] = useState({});
  const { user } = useUser();
  const socketRef = useRef(null);
  let retryAttempts = 0;
  const maxRetries = 5;

  useEffect(() => {
    function connectWebSocket() {
      if (retryAttempts >= maxRetries) {
        console.error("WebSocket reconnection limit reached.");
        return;
      }
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        return;
      }

      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        retryAttempts = 0;
        ws.send(
          JSON.stringify({ action: "subscribeToPost", payload: { postName } }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (
            message.action === "updateReactions" &&
            message.payload.postName === postName
          ) {
            const counts = {};
            emojis.forEach((emoji) => {
              counts[emoji] = message.payload.reactions.filter(
                (r) => r.emoji === emoji,
              ).length;
            });
            setReactionCounts(counts);
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket encountered an error:", error);
      };

      ws.onclose = () => {
        console.warn(
          "⚠️ WebSocket connection closed. Attempting to reconnect...",
        );
        retryAttempts++;
        setTimeout(connectWebSocket, 3000);
      };

      socketRef.current = ws;
    }

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [postName]);

  const handleReaction = (emoji) => {
    if (!user) {
      alert("Du må være logget inn for å legge igjen en reaksjon");
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket er ikke tilkoblet. Prøv igjen senere.");
      return;
    }

    const reactionPayload = {
      action: "reactToPost",
      payload: {
        postName,
        emoji,
        userId: user.googleId,
      },
    };

    try {
      socketRef.current.send(JSON.stringify(reactionPayload));
    } catch (error) {
      console.log("Lagring av reaksjon feilet:", error);
    }
  };

  return (
    <div>
      {emojis.map((emoji) => (
        <button key={emoji} onClick={() => handleReaction(emoji)}>
          {emoji} {reactionCounts[emoji] || 0}
        </button>
      ))}
    </div>
  );
}
