const express = require('express');
const mongoose = require('mongoose');

// 1. Initialize the Express app
const app = express();
const port = 3000;

// 2. Get the database address from the secret message (environment variable)
const mongoURI = process.env.MONGO_URI;

// 3. Connect to the MongoDB database
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    // This is a victory message!
    console.log('✅ MongoDB Connected to the "fiambondv3" database!');
  })
  .catch(err => {
    // This is an error message if something goes wrong
    console.error('❌ ERROR: Could not connect to MongoDB.', err);
  });

// 4. Create a "Hello World" route to test the server
app.get('/', (req, res) => {
  res.send('Hello from the FiamBond V3 API!');
});

// 5. Start the engine and listen for requests
app.listen(port, () => {
  console.log(`🚀 FiamBond V3 server is running on http://localhost:${port}`);
});