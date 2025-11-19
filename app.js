// app.js — FINAL version (email-based update/delete)
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Catoegories.html");
});

// connect DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "jewelry_db",
});

db.connect(err => {
  if (err) return console.log("DB Error:", err);
  console.log("Connected to jewelry_db!");
});



app.post("/signup", (req, res) => {
  const mail = req.body.mail;
  const pw = req.body.pw;
  const repeatPw = req.body["repeat-pw"];

  if (!mail || !pw || !repeatPw) {
    return res.send(`
      <script>alert('Please fill all required fields.');
      window.history.back();</script>
    `);
  }

  if (pw !== repeatPw) {
    return res.send(`
      <script>alert('Passwords do not match.');
      window.history.back();</script>
    `);
  }

  const sql = "INSERT INTO accounts (email, password) VALUES (?, ?)";
  db.query(sql, [mail, pw], (err) => {
    if (err) {
      console.log("Signup Error:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.send(`
          <script>alert('This email is already registered.');
          window.history.back();</script>
        `);
      }
      return res.send(`
        <script>alert('Error creating account.');
        window.history.back();</script>
      `);
    }

    res.send(`
      <script>alert('Account created successfully! Please log in.');
      window.location.href = 'login.html';</script>
    `);
  });
});


// ---------------------------------------------
// LOGIN
// ---------------------------------------------
app.post("/login", (req, res) => {
  const { usern, pw } = req.body;

  const sql = "SELECT * FROM accounts WHERE email = ? AND password = ?";
  db.query(sql, [usern, pw], (err, results) => {
    if (err) return res.send(`<script>alert('Login error'); history.back();</script>`);

    if (results.length === 0) {
      return res.send(`<script>alert('Invalid login'); history.back();</script>`);
    }

    res.send(`<script>alert('Welcome back!'); window.location='Catoegories.html';</script>`);
  });
});


// ---------------------------------------------
// UPDATE EMAIL (using oldEmail)
// ---------------------------------------------
app.put("/update-email", (req, res) => {
  const { oldEmail, newEmail } = req.body;

  if (!oldEmail || !newEmail) {
    return res.send({ errmessage: "Both old and new email required" });
  }

  const sql = "UPDATE accounts SET email = ? WHERE email = ?";
  db.query(sql, [newEmail, oldEmail], (err, results) => {
    if (err) return res.send({ errmessage: err.message });

    if (results.affectedRows === 0) {
      return res.send({ errmessage: "Email not found" });
    }

    res.send({ message: "Email updated!" });
  });
});


// ---------------------------------------------
// UPDATE PASSWORD (using email)
// ---------------------------------------------
app.put("/update-password", (req, res) => {
  const { email, pw } = req.body;

  if (!email || !pw) {
    return res.send({ errmessage: "Email and new password required" });
  }

  const sql = "UPDATE accounts SET password = ? WHERE email = ?";
  db.query(sql, [pw, email], (err, results) => {
    if (err) return res.send({ errmessage: err.message });

    if (results.affectedRows === 0) {
      return res.send({ errmessage: "Email not found" });
    }

    res.send({ message: "Password updated!" });
  });
});


// ---------------------------------------------
// DELETE USER BY EMAIL
// ---------------------------------------------
app.delete("/delete-user/:email", (req, res) => {
  const email = req.params.email;

  const sql = "DELETE FROM accounts WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.send({ errmessage: err.message });

    if (results.affectedRows === 0) {
      return res.send({ errmessage: "Email not found" });
    }

    res.send({ message: "User deleted!" });
  });
});


// ---------------------------------------------
// REVIEWS (unchanged)
// ---------------------------------------------
app.get("/api/reviews", (req, res) => {
  db.query("SELECT * FROM reviews ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to load reviews" });
    res.json(rows);
  });
});

app.post("/api/reviews", (req, res) => {
  const { name = "Anonymous", rating = 5, comment } = req.body;

  if (!comment) return res.status(400).json({ error: "Comment required" });

  const sql = "INSERT INTO reviews (name, rating, comment, date) VALUES (?, ?, ?, CURDATE())";
  db.query(sql, [name, rating, comment], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to save review" });

    res.json({
      id: result.insertId,
      name,
      rating,
      comment,
      date: new Date().toISOString().slice(0, 10),
    });
  });
});


// server
app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});
