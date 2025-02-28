import { useEffect, useState } from "react";
import axios from "axios";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get("http://localhost:8000/api/me", {
          withCredentials: true, // ✅ Ensures session cookie is sent
        });

        console.log("✅ Fetched user:", response.data);
        setUser(response.data);
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
