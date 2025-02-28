import { useState, useEffect } from "react";
import PostList from "../components/PostList.jsx";
import axios from "axios";

export default function PostsListPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get("http://localhost:8000/api/posts", {
          withCredentials: true,
        });
        setPosts(response.data); // ✅ Fetches ALL posts
      } catch (error) {
        console.error("Error fetching posts:", error);
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
