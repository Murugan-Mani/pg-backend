require("dotenv").config();

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry');

const app = express();

app.use(cors());
app.use(express.json());

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nattasha';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post("/api/enquiry", async (req, res) => {
  try {
    const { name, phone, email, roomType, message } = req.body;

    // persist enquiry
    const saved = await Enquiry.create({ name, phone, email, roomType, message });

    const text = `
New PG Enquiry

Name: ${name}
Phone: ${phone}
Email: ${email}
Room Type: ${roomType}
Message: ${message}
`;

    await client.messages.create({
      body: text,
      from: 'whatsapp:+14155238886', // Sandbox Number
      to: 'whatsapp:+917305718478', // Your WhatsApp Number
    });

    res.json({
      success: true,
      message: "WhatsApp notification sent",
      enquiry: saved
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET all enquiries
app.get('/api/enquiries', async (req, res) => {
  try {
    const list = await Enquiry.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch enquiries' });
  }
});

// DELETE an enquiry by id
app.delete('/api/enquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Enquiry.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Enquiry not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete enquiry' });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});