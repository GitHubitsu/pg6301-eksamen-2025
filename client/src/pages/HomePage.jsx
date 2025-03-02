import { useState, useEffect } from "react";
import PostList from "../components/PostList.jsx";
import axios from "axios";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get(`${API_URL}/api/posts/latest`, {
          withCredentials: true,
        });
        setPosts(response.data);
      } catch (error) {
        console.error("Kunne ikke laste innlegg:", error);
      }
    }

    fetchPosts();
  }, []);

  return (
    <>
      <h1>Siste innlegg</h1>
      <PostList posts={posts} />
    </>
  );
}
