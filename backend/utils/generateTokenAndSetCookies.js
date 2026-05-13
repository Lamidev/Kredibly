// utils/generateTokenAndSetCookies.js
const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (res, userId, name, email, role) => {
  const token = jwt.sign({ userId, name, email, role }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  };

  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie("token", token, cookieOptions);
  return token;
};

module.exports = { generateTokenAndSetCookie };
