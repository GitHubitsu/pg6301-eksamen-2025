import { useEffect, useState } from "react";
import axios from "axios";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`${API_URL}/api/me`, {
          withCredentials: true, // ✅ Ensures session cookie is sent
        });

        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [API_URL]);

  return { user, loading };
}
