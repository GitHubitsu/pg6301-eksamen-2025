import { useState, useEffect } from "react";
import PostList from "../components/PostList.jsx";
import axios from "axios";

export default function HomePage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/posts/latest",
          { withCredentials: true },
        );
        setPosts(response.data); // ✅ Store latest posts
      } catch (error) {
        console.error("Error fetching posts:", error);
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
