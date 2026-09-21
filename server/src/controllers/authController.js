const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const ApiResponse = require('../utils/apiResponse');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, { message: 'Email already registered', statusCode: 409 });
    }

    const user = await User.create({ name, email, password, companyName });
    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, {
      message: 'Registration successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, companyName: user.companyName, role: user.role, phoneNumberId: user.phoneNumberId },
        token,
      },
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, { message: 'Invalid email or password', statusCode: 401 });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, {
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, companyName: user.companyName, role: user.role, phoneNumberId: user.phoneNumberId },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  return ApiResponse.success(res, { message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  return ApiResponse.success(res, {
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      companyName: req.user.companyName,
      role: req.user.role,
      phoneNumberId: req.user.phoneNumberId,
      createdAt: req.user.createdAt,
    },
  });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, companyName, phoneNumberId } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (companyName !== undefined) updates.companyName = companyName;
    if (phoneNumberId !== undefined) updates.phoneNumberId = phoneNumberId;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    return ApiResponse.success(res, {
      message: 'Profile updated',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
        phoneNumberId: user.phoneNumberId,
      },
    });
  } catch (error) {
    next(error);
  }
};
