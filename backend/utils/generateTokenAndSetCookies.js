// utils/generateTokenAndSetCookies.js
const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    path: "/",
  };

  if (isProduction && process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  res.cookie("token", token, cookieOptions);
  return token;
};

module.exports = { generateTokenAndSetCookie };
