import { useState } from "react";
import { useParams, useLoaderData, Link } from "react-router-dom";
import axios from "axios";
import CommentsList from "../components/CommentsList";
import AddCommentForm from "../components/AddCommentForm.jsx";
import Emojis from "../components/Emojis.jsx";
import { useUser } from "../hooks/useUser.jsx";

export default function PostPage() {
  const { name } = useParams();
  const { comments: initialComments, postContent } = useLoaderData();
  const { user } = useUser();
  const API_URL = import.meta.env.VITE_API_URL;

  const contentArray = Array.isArray(postContent.content)
    ? postContent.content
    : [postContent.content];

  const [comments, setComments] = useState(initialComments);

  async function onAddComment({ nameText, commentText }) {
    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${name}/comments`,
        {
          postedBy: nameText,
          text: commentText,
        },
        {
          withCredentials: true,
        },
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <h1>{postContent.title}</h1>

      {contentArray.map((p, index) => (
        <p key={index}>{p}</p>
      ))}

      <Emojis postName={name} currentUserId={"user?.googleId"} />

      <AddCommentForm onAddComment={onAddComment} />
      <CommentsList comments={comments} />
    </>
  );
}

export async function loader({ params }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${API_URL}/api/posts/${params.name}`, {
    withCredentials: true,
  });
  const { title, comments, content } = response.data;

  return {
    comments,
    postContent: { title, content },
  };
}
