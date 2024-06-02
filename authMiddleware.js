// authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "secreto", (err, user) => {
      if (err) {
        return res.sendStatus(403); // Token inválido
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // No se encontró el token
  }
};

module.exports = authenticateJWT;
