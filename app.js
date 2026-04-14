const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "secretkey",
  resave: false,
  saveUninitialized: true
}));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "iWANTITIGOTIT@29", 
  database: "secure_app"
});

db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("Connected to MySQL ✅");
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(sql, [username, email, hashedPassword, "user"], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Error registering user ❌");
    }
    res.send("User Registered Successfully ✅");
  });
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});

// Login logic
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) return res.send("Error ❌");

    if (results.length === 0) {
      return res.send("User not found ❌");
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user;
      res.redirect("/user");
    } else {
      res.send("Wrong password ❌");
    }
  });
});

// Admin route
app.get("/admin", (req, res) => {
  if (!req.session.user) {
    return res.send("Please login first ❌");
  }

  if (req.session.user.role !== "admin") {
    return res.send("Access denied ❌ (Admin only)");
  }

  res.send("Welcome Admin 🔥");
});

// User route
app.get("/user", (req, res) => {
  if (!req.session.user) {
    return res.send("Please login first ❌");
  }

  res.send("Welcome User 👤");
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.send("Logged out successfully ✅");
  });
});

// Start server
app.listen(3000, () => console.log("Server running on 3000"));

