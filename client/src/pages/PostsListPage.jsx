import { useState, useEffect } from "react";
import PostList from "../components/PostList.jsx";
import axios from "axios";

export default function PostsListPage() {
  const [posts, setPosts] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get(`${API_URL}/api/posts`, {
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
      <h1>Alle innlegg</h1>
      <PostList posts={posts} />
    </>
  );
}
