import { Link } from "react-router-dom";

export default function PostList({ posts }) {
  return (
    <ul className="cards">
      {posts.map((post) => {
        const createdAt = new Date(post.createdAt);
        const month = createdAt.toLocaleString("en-US", { month: "short" });
        const date = createdAt.getDate();
        return (
          <li className="card" key={post.name}>
            <Link to={"/posts/" + post.name}>
              <time className="time" dateTime={createdAt.toISOString()}>
                <div className="month">{month}</div>
                <div className="date">{date}</div>
              </time>
              <h2>{post.title}</h2>
              <div className="meta">
                <span>Skrevet av {post.postedBy}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
