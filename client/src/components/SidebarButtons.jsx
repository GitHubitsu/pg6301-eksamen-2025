import { useState } from "react";
import axios from "axios";

export default function SidebarButtons({ user, post, onVerificationUpdate }) {
  const [isVerified, setIsVerified] = useState(user?.verified);

  async function verifyUser() {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/verify-user",
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
    }
  }

  return (
    <div className="buttons">
      {isVerified ? (
        <div className="verified-box">✅ Verified</div>
      ) : user ? (
        <button onClick={verifyUser} className="sidebar-button">
          Verify Account
        </button>
      ) : null}

      {user?.verified && <button className="sidebar-button">Nytt</button>}
    </div>
  );
}
