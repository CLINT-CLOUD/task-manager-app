const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User'); // adjust path if needed

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clear existing users (optional)
    await User.deleteMany();

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
      },
    ];

    await User.insertMany(users);

    console.log('✅ Users seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
