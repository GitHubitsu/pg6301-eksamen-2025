import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SidebarButtons({ user, post, onVerificationUpdate }) {
  const [isVerified, setIsVerified] = useState(user?.verified);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function verifyUser() {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/verify-user`,
        {},
        { withCredentials: true },
      );

      if (response.data.success) {
        setIsVerified(true);
        if (onVerificationUpdate) {
          onVerificationUpdate(true);
        }
      }
    } catch (error) {
      console.error("Error verifying user:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="buttons">
      {isVerified ? (
        <div className="verified-box">Verified</div>
      ) : user ? (
        <button
          onClick={verifyUser}
          className="sidebar-button"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify Account"}
        </button>
      ) : null}

      {user?.verified && (
        <button
          className="sidebar-button"
          onClick={() => navigate("/create-post")}
        >
          + Nytt innlegg
        </button>
      )}
    </div>
  );
}
