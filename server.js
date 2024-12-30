const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt"); // For password hashing
const dotenv = require("dotenv"); // For environment variables
const mongoose = require("mongoose");
const axios = require("axios"); // Import axios

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Atlas connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB Atlas
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User model
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Contact model
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true } // Adding timestamps for createdAt and updatedAt
);

const Contact = mongoose.model("Contact", contactSchema);

// Contact form submission endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const newContact = new Contact({ name, email, message });
    await newContact.save(); // Saves the document, creates collection if it doesn't exist
    res.status(201).json({ message: "Contact message saved successfully." });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ message: "Error saving contact message." });
  }
});

// GET endpoint to retrieve contact messages
app.get("/api/contact", async (req, res) => {
  try {
    const contacts = await Contact.find(); // Fetches all contact messages
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Error fetching contact messages." });
  }
});

// User registration endpoint
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user." });
  }
});

// User login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({ message: "Login successful", name: user.firstName });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in." });
  }
});

// Prediction endpoint (assuming this calls a FastAPI service for prediction)
app.post("/predict", async (req, res) => {
  try {
    const { age, sex, bmi, children, smoker, region } = req.body;

    // Call the FastAPI prediction service (change URL if necessary)
    const response = await axios.post("http://localhost:8000/predict", {
      age,
      sex,
      bmi,
      children,
      smoker,
      region,
    });

    // Return the predictions from FastAPI
    res.json(response.data);
  } catch (error) {
    console.error("Error calling FastAPI:", error);
    res.status(500).json({ message: "Error processing prediction request" });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
