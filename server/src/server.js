console.log("🚀 server.js is being executed...");
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { MongoClient, ServerApiVersion } from "mongodb";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

app.use(express.json());
app.use(
  cors({
    origin: CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
      crypto: { secret: SESSION_SECRET },
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

let db;

async function connectToDB() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
      },
    });
    await client.connect();
    db = client.db("Posts");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

await connectToDB();

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
        user = {
          googleId: profile.id,
          displayName: profile.displayName,
          verified: false,
        };
        await db.collection("users").insertOne(user);
      }
      return done(null, user);
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.googleId);
});
passport.deserializeUser(async (googleId, done) => {
  try {
    const user = await db.collection("users").findOne({ googleId });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
/*
app.use((req, res, next) => {
  console.log("🔍 Incoming Request:", req.method, req.url);
  console.log("🔍 Session Data:", req.session);
  console.log("🔍 User Data:", req.user);
  next();
});
*/
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"], session: true }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: `${CLIENT_URL}/login`,
  }),
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }

    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("connect.sid", { path: "/" });
      res.redirect(CLIENT_URL);
    });
  });
});

app.get("/api/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  /*if (!req.isAuthenticated()) {
    console.log("❌ User not authenticated.");
    return res.status(401).json({ error: "Not authenticated" });
  }*/
  res.json(req.user);
});

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await db.collection("posts").find().toArray();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/posts/latest", async (req, res) => {
  try {
    const latestPosts = await db
      .collection("posts")
      .find({ createdAt: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(3)
      .toArray();
    res.json(latestPosts);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/posts/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const post = await db.collection("posts").findOne({ name });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/reactions", async (req, res) => {
  try {
    const posts = await db.collection("posts").find().toArray();
    const allReactions = posts.flatMap((post) => post.reactions);

    res.json(allReactions);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/posts/byUser/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userPosts = await db
      .collection("posts")
      .find({ postedById: userId })
      .toArray();
    res.json(userPosts);
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/posts", async (req, res) => {
  if (!req.isAuthenticated() || !req.user.verified) {
    return res
      .status(403)
      .json({ error: "Bare verifiserte brukere kan opprette innlegg." });
  }

  const { title, content, postedBy, postedById } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Tittel og innhold er påkrevd." });
  }

  if (content.split(" ").length < 10) {
    return res
      .status(400)
      .json({ error: "Teksten må inneholde minst 10 ord." });
  }

  try {
    const newPost = {
      title,
      content: Array.isArray(content) ? content : [content],
      postedBy: req.user.displayName,
      postedById: req.user.googleId,
      name: title.toLowerCase().replace(/[^a-z0-9-]+/g, "-"), // Generate a URL-friendly name
      comments: [],
      reactions: [],
      createdAt: new Date(),
    };
    await db.collection("posts").insertOne(newPost);
    res.status(201).json({ message: "Innlegget er blitt opprettet!" });
  } catch (error) {
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

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

async function startServer() {
  await connectToDB();

  const server = app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });

  if (!db) {
    console.error("❌ Database connection failed! Exiting...");
    process.exit(1);
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    console.log("Websocket connected");
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        const { action, payload } = data;

        if (action === "reactToPost") {
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
          const post = await db.collection("posts").findOne({ name: postName });

          if (!post) {
            ws.send(
              JSON.stringify({ action: "error", error: "Post not found." }),
            );
            return;
          }

          if (!post.reactions) {
            post.reactions = [];
          }

          const existingReactionIndex = post.reactions.findIndex(
            (r) => r.userId === userId,
          );

          if (existingReactionIndex >= 0) {
            post.reactions[existingReactionIndex].emoji = emoji;
            post.reactions[existingReactionIndex].timestamp = new Date();
          } else {
            post.reactions.push({
              emoji,
              userId,
              timestamp: new Date(),
            });
          }

          await db
            .collection("posts")
            .updateOne(
              { name: postName },
              { $set: { reactions: post.reactions } },
            );

          const uniqueReactions = await db
            .collection("posts")
            .aggregate([
              { $match: { "reactions.userId": userId } },
              { $group: { _id: "$name" } },
            ])
            .toArray();

          if (uniqueReactions.length >= 3) {
            await db
              .collection("users")
              .updateOne({ googleId: userId }, { $set: { verified: true } });
          }

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
