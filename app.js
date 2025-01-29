// Import required modules
const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require("express-validator");
require("dotenv").config();

// Initialize the app
const app = express();
const PORT = 3000;
const DATA_FILE = "./database.json";

// Middleware setup
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true, // Prevents client-side JavaScript access
      sameSite: "strict", // Protects against CSRF attacks
    },
  })
);

// Serve static files
app.use("/public", express.static("public")); // Unprotected routes for login and register
app.use("/protected", (req, res, next) => {
  if (!req.session.user) {
    //console.warn("Unauthorized access attempt.");
    return res.status(401).send("Unauthorized");
  }
  next();
});
app.use("/protected", express.static("private/protected")); // Protected routes for authenticated users

// Helper function to read and write to the JSON file
const readData = async () => {
  try {
    const data = await fs.promises.readFile(DATA_FILE);
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    throw err;
  }
};

const writeData = async (data) => {
  try {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    throw err;
  }
};

// Limiter
const Limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //  15 minutes
  max: 5, // Blocks after 5 failed attempts
  message: "Too many login attempts, please try again later."
});


// Routes

// Home route
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/public/login.html");
  }
  res.redirect("/protected/index.html");
});

// Register route
app.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username must only contain letters, numbers, and underscores"
      ),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),
  ],
  Limiter,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array()[0].msg);
    }

    const { username, password } = req.body;
    try {
      const data = await readData();
      const userExists = data.users.find((u) => u.username === username);

      if (userExists) {
        return res.status(400).send("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      data.users.push({ username, password: hashedPassword });
      await writeData(data);
      res.status(201).send("User registered successfully");
    } catch (err) {
      return res.status(500).send("Server error");
    }
  }
);


// Login route
app.post(
  "/login",
  [
    body("username")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Invalid username")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Invalid username format"),
    body("password")
      .trim()
      .isLength({ min: 6 })
      .withMessage("Invalid password"),
  ],
  Limiter,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors.array()[0].msg);
    }

    const { username, password } = req.body;
    try {
      const data = await readData();
      const user = data.users.find((u) => u.username === username);

      if (!user) {
        return res.status(401).send("Invalid credentials");
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        req.session.regenerate((err) => {
          if (err) {
            return res.status(500).send("Error creating session");
          }
          req.session.user = user;
          return res.redirect("/protected/index.html");
        });
      } else {
        return res.status(401).send("Invalid credentials");
      }
    } catch (err) {
      return res.status(500).send("Server error");
    }
  }
);

// Dashboard route (protected)
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }
  res.redirect("/protected/dashboard.html");
});

// Add task route
app.post("/add", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }
  const { task } = req.body;
  try {
    const data = await readData();
    const taskId = Date.now();
    data.tasks.push({ id: taskId, task, user: req.session.user.username });
    await writeData(data);
    res.redirect("/protected/dashboard.html");
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

// Get tasks for the logged-in user
app.get("/tasks", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const data = await readData();
    const userTasks = data.tasks.filter(
      (task) => task.user === req.session.user.username
    );
    res.json(userTasks);
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

// Delete task route
app.delete("/tasks/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id, 10);
  try {
    const data = await readData();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    await writeData(data);

    res.send("Task deleted");
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.clearCookie("connect.sid"); // Ensures session cookie is deleted
    res.redirect("/public/login.html");
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
