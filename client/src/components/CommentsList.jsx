export default function CommentsList({ comments }) {
  if (!comments || comments.length === 0) {
    return <p>Ingen kommentarer enda.</p>;
  }
  return (
    <div className="comments-list">
      <h3>Kommentarer: </h3>
      {comments.map((comment) => (
        <div key={comment.text}>
          <h4>{comment.postedBy}</h4>
          <p>{comment.text}</p>
        </div>
      ))}
    </div>
  );
}
