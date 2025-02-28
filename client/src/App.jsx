import { createBrowserRouter, RouterProvider } from "react-router-dom";
import axios from "axios";
import "./App.css";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import PostPage, { loader as postLoader } from "./pages/PostPage.jsx";
import PostsListPage from "./pages/PostsListPage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Layout from "./components/Layout.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const routes = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/posts",
        element: <PostsListPage />,
      },
      {
        path: "/posts/:name",
        element: <PostPage />,
        loader: postLoader,
      },
      {
        path: "/create-post",
        element: <CreatePostPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
