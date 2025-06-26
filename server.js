const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); // Load environment variables

const app = express(); // ✅ Declare app BEFORE using it

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks')); // ✅ Corrected this line
app.use('/api/admin', require('./routes/admin'));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo error:', err));

const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// force redeploy
