console.log("🚀 server.js is being executed...");
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { MongoClient, ServerApiVersion } from "mongodb";
import { WebSocketServer } from "ws";
console.log("✅ Modules imported");

console.log("📡 Setting up Express...");
const app = express();
console.log("✅ Express initialized");
const PORT = process.env.PORT || 8000;

import dotenv from "dotenv";
dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false, // ✅ Ensure uninitialized sessions are saved
    store: MongoStore.create({
      mongoUrl: "mongodb://127.0.0.1:27017/eksamen-react",
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // Sessions expire after 14 days
    }),
    cookie: {
      secure: false, // Keep false for local development (set to true in production with HTTPS)
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

let db;

console.log("🔗 Connecting to database...");
async function connectToDB() {
  console.log("🔍 Connecting to MongoDB...");
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  console.log("⏳ Awaiting MongoDB connection...");
  await client.connect();
  console.log("✅ Connected to MongoDB");
  console.log("✅ MongoDB Connected!");
  db = client.db("eksamen-react");
}
await connectToDB(); // 🚨 Possible blocking point
console.log("✅ Database connected");

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      let user = await db.collection("users").findOne({ googleId: profile.id });

      if (!user) {
        // User signing in for first time, create new user
        user = {
          googleId: profile.id,
          displayName: profile.displayName,
          verified: false, // Set default user status
        };
        await db.collection("users").insertOne(user);
      }

      return done(null, user);
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("🔑 Serializing user:", user.googleId);
  done(null, user.googleId);
});
passport.deserializeUser(async (googleId, done) => {
  console.log("🔍 Deserializing user:", googleId);
  if (!googleId) {
    console.log("❌ No googleId found in session.");
    return done(null, false);
  }
  try {
    const user = await db.collection("users").findOne({ googleId });

    if (!user) {
      console.log("❌ User not found in DB!");
      return done(null, false);
    }

    console.log("✅ Found user in DB:", user);
    done(null, user);
  } catch (error) {
    console.error("❌ Error deserializing user:", error);
    done(error);
  }
});

app.use((req, res, next) => {
  console.log("🛠️ SESSION DEBUG: ", req.session);
  console.log("🛠️ USER DEBUG: ", req.user);
  next();
});

app.get("/", (req, res) => {
  res.send("🚀 Server is running! Welcome to the API.");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"], session: true }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/",
    failureRedirect: "http://localhost:5173/login",
  }),
);

app.get("/api/me", (req, res) => {
  console.log("🔍 Checking session data:");
  console.log("Session:", req.session);
  console.log("User:", req.user);
  if (!req.isAuthenticated()) {
    console.log("❌ User not authenticated.");
    return res.status(401).json({ error: "Not authenticated" });
  }
  console.log("✅ User authenticated:", req.user);
  res.json(req.user);
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy((error) => {
      if (error) {
        console.error("❌ Error destroying session:", error);
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("connect.sid", { path: "/" }); // Explicitly clear session cookie
      console.log("✅ Successfully logged out");

      res.redirect("http://localhost:5173/");
    });
  });
});
/*
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect("http://localhost:5173/");
    });
  });
});
*/
app.get("/api/posts/latest", async (req, res) => {
  console.log("🚀 Request received at /api/posts/latest");
  if (!db) {
    console.error("❌ Database not connected");
    return res.status(500).json({ error: "Database not connected" });
  }

  try {
    console.log("✅ Fetching latest posts...");
    const latestPosts = await db
      .collection("posts")
      .find({ createdAt: { $exists: true } })
      .sort({ createdAt: -1 }) // Filtrerer nyeste først
      .limit(3) // Henter kun tre
      .toArray();

    console.log("📝 Latest posts result:", latestPosts);

    if (!latestPosts.length) {
      console.warn("⚠️ No posts found!");
      return res.status(404).json({ error: "No posts found" });
    }

    res.json(latestPosts);
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/posts/:name", async (req, res) => {
  const { name } = req.params;

  const post = await db.collection("posts").findOne({ name });

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json(post);
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await db.collection("posts").find().toArray();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/reactions", async (req, res) => {
  try {
    const posts = await db.collection("posts").find().toArray();
    const allReactions = posts.flatMap((post) => post.reactions); // ✅ Extract all reactions

    res.json(allReactions);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/posts", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.verified) {
    return res
      .status(403)
      .json({ error: "Only verified users can create posts." });
  }

  const { title, content, postedBy, postedById } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  if (content.split(" ").length < 10) {
    return res
      .status(400)
      .json({ error: "Content must be at least 10 words." });
  }

  try {
    const newPost = {
      title,
      content: Array.isArray(content) ? content : [content],
      postedBy,
      postedById,
      name: title.toLowerCase().replace(/[^a-z0-9-]+/g, "-"), // Generate a URL-friendly name
      comments: [],
      reactions: [],
      createdAt: new Date(),
    };

    await db.collection("posts").insertOne(newPost);
    console.log("✅ Post created:", newPost);
    res.status(201).json({ message: "Post created successfully!" });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/posts/:name/comments", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ error: "Du må være logget inn for å velge en emoji." });
  }

  const { name } = req.params;
  const { postedBy, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Comment text is required." });
  }

  const newComment = {
    userId: req.user.googleId,
    postedBy: req.user.displayName,
    text,
    timestamp: new Date(),
  };

  try {
    const updatedPost = await db.collection("posts").findOneAndUpdate(
      { name },
      {
        $push: { comments: newComment },
      },
      {
        returnDocument: "after",
      },
    );
    res.json(updatedPost);
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/posts/byUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userPosts = await db
      .collection("posts")
      .find({ postedBy: userId })
      .toArray();
    res.json(userPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/verify-user", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  try {
    await db
      .collection("users")
      .updateOne({ googleId: req.user.googleId }, { $set: { verified: true } });

    req.user.verified = true; // Update session data
    res.json({ success: true });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

app.post("/api/verify", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    await db
      .collection("users")
      .updateOne({ googleId: req.user.googleId }, { $set: { verified: true } });
    res.json({ message: "User verified successfully" });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/debug-session", (req, res) => {
  console.log("🔍 Checking session data:");
  console.log("Session:", req.session);
  console.log("Session Passport:", req.session.passport);
  console.log("User:", req.user);

  res.json({
    session: req.session,
    passport: req.session.passport,
    user: req.user,
  });
});

app.put("/api/posts/:name", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { name } = req.params;
  const { title, content } = req.body;
  const userId = req.user.googleId;

  try {
    const post = await db.collection("posts").findOne({ name });

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.postedById !== userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own posts." });
    }

    await db.collection("posts").updateOne(
      { name },
      {
        $set: {
          title,
          content: Array.isArray(content) ? content : [content],
        },
      },
    );

    res.status(200).json({ message: "Post updated successfully!" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Database error" });
  }
});

async function startServer() {
  console.log("🚀 Starting server...");
  await connectToDB();

  console.log("🚀 Starting Express server...");

  const server = app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });

  if (!db) {
    console.error("❌ Database connection failed! Exiting...");
    process.exit(1);
  }

  // ✅ Test Route
  app.get("/test", (req, res) => {
    res.json({ message: "Server is working!" });
  });

  console.log("✅ Test route /test added!");

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("🔗 WebSocket Connected!");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        const { action, payload } = data;

        if (action === "reactToPost") {
          console.log("🔄 Processing reaction for:", payload);

          const { postName, emoji, userId } = payload;

          if (!userId) {
            ws.send(
              JSON.stringify({
                action: "error",
                error: "You must be logged in to react.",
              }),
            );
            return;
          }

          const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
          if (!validEmojis.includes(emoji)) {
            ws.send(
              JSON.stringify({ action: "error", error: "Invalid emoji." }),
            );
            return;
          }

          // Fetch the post from the database
          const post = await db.collection("posts").findOne({ name: postName });

          if (!post) {
            ws.send(
              JSON.stringify({ action: "error", error: "Post not found." }),
            );
            return;
          }

          // Ensure `reactions` exists in post
          if (!post.reactions) {
            post.reactions = [];
          }

          // Find existing reaction by this user
          const existingReactionIndex = post.reactions.findIndex(
            (r) => r.userId === userId,
          );

          if (existingReactionIndex >= 0) {
            // Update the existing reaction
            post.reactions[existingReactionIndex].emoji = emoji;
            post.reactions[existingReactionIndex].timestamp = new Date();
          } else {
            // Add new reaction
            post.reactions.push({
              emoji,
              userId,
              timestamp: new Date(),
            });
          }

          // Update the database
          await db
            .collection("posts")
            .updateOne(
              { name: postName },
              { $set: { reactions: post.reactions } },
            );

          // Check how many unique posts the user has reacted to
          const uniqueReactions = await db
            .collection("posts")
            .aggregate([
              { $match: { "reactions.userId": userId } },
              { $group: { _id: "$name" } },
            ])
            .toArray();

          console.log(
            `🔍 User ${userId} has reacted to ${uniqueReactions.length} unique posts.`,
          );

          if (uniqueReactions.length >= 3) {
            console.log(`✅ User ${userId} is now verified.`);
            await db
              .collection("users")
              .updateOne({ googleId: userId }, { $set: { verified: true } });
          }

          // Broadcast updated reactions to all clients subscribed to this post
          const reactionUpdate = {
            action: "updateReactions",
            payload: { postName, reactions: post.reactions },
          };

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(reactionUpdate));
            }
          });
        } else {
          ws.send(
            JSON.stringify({ action: "error", error: "Unknown action." }),
          );
        }
      } catch (error) {
        console.error("❌ WebSocket Processing Error:", error);
        ws.send(
          JSON.stringify({ action: "error", error: "Internal server error." }),
        );
      }
    });

    ws.on("close", () => {
      console.log("⚠️ WebSocket connection closed.");
    });
  });

  app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      console.log("✅ Registered route:", r.route.path);
    }
  });
}

startServer().catch((err) => {
  console.error("❌ Server startup failed:", err);
  process.exit(1);
});
