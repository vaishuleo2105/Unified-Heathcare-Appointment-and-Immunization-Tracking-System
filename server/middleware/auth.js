const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async function protect(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' })
    }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired. Please login again.' })
  }
}
