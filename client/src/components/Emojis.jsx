import { useEffect, useState, useRef } from "react";
import { useUser } from "../hooks/useUser.jsx";

const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function Emojis({ postName }) {
  const [reactionCounts, setReactionCounts] = useState({});
  // const [socket, setSocket] = useState(null);
  const { user } = useUser();
  const socketRef = useRef(null);

  useEffect(() => {
    function connectWebSocket() {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.warn("⚠️ WebSocket already open, skipping reconnection.");
        return;
      }

      const ws = new WebSocket("ws://localhost:8000");

      // const connectWebSocket = () => {

      ws.onopen = () => {
        console.log("🔗 Connected to WebSocket");
        ws.send(
          JSON.stringify({ action: "subscribeToPost", payload: { postName } }),
        );
      };

      ws.onmessage = (event) => {
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
        } else if (message.action === "error") {
          console.error("❌ WebSocket Error:", message.error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket encountered an error:", error);
      };

      ws.onclose = () => {
        console.warn(
          "⚠️ WebSocket connection closed. Attempting to reconnect...",
        );
        setTimeout(connectWebSocket, 3000); // Retry connection after 3 seconds
      };

      socketRef.current = ws;
    }

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        console.log("⚠️ Closing WebSocket...");
        socketRef.current.close();
      }
    };
  }, [postName]);

  const handleReaction = (emoji) => {
    if (!user) {
      alert("You must be logged in to react!");
      return;
    }
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("⚠️ WebSocket is not open. Cannot send reaction.");
      return;
    }

    const reactionPayload = {
      action: "reactToPost",
      payload: {
        postName,
        emoji,
        userId: user.googleId, // ✅ Ensures userId is included
      },
    };

    console.log("📩 Sending reaction:", reactionPayload);
    socketRef.current.send(JSON.stringify(reactionPayload));
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
