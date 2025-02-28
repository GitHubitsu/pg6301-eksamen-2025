import { useState } from "react";
import { useParams, useLoaderData, Link } from "react-router-dom";
import axios from "axios";
import CommentsList from "../components/CommentsList";
import AddCommentForm from "../components/AddCommentForm.jsx";
import Emojis from "../components/Emojis.jsx";

export default function PostPage() {
  const { name } = useParams();
  const { comments: initialComments, postContent } = useLoaderData();

  console.log("🔍 Route Param (name):", name);
  console.log("📩 Loaded Data from API:", postContent);

  const contentArray = Array.isArray(postContent.content)
    ? postContent.content
    : [postContent.content];

  const [comments, setComments] = useState(initialComments);

  async function onAddComment({ nameText, commentText }) {
    const response = await axios.post(
      "/api/posts/" + name + "/comments",
      {
        postedBy: nameText,
        text: commentText,
      },
      {
        withCredentials: true,
      },
    );
    setComments(response.data.comments);
  }

  return (
    <>
      <h1>{postContent.title}</h1>

      {contentArray.map((p, index) => (
        <p key={index}>{p}</p>
      ))}

      <Emojis postName={name} currentUserId={"user123"} />

      <AddCommentForm onAddComment={onAddComment} />
      <CommentsList comments={comments} />
    </>
  );
}

export async function loader({ params }) {
  console.log("🔍 Fetching Post:", params.name);
  const response = await axios.get("/api/posts/" + params.name, {
    withCredentials: true,
  });
  console.log("📩 Response:", response.data);
  const { title, comments, content } = response.data;

  return {
    comments,
    postContent: { title, content },
  };
}
