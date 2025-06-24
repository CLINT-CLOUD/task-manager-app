const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('id email role');
    
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
