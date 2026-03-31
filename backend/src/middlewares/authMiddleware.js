const jwt = require('jsonwebtoken');

const PUBLIC_PATHS = ['/api/health', '/api/auth/login'];

module.exports = (req, res, next) => {
  if (PUBLIC_PATHS.includes(req.path) || req.path.startsWith('/uploads')) {
    return next();
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
