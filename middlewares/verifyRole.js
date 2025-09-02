const jwt = require('jsonwebtoken');

module.exports = (requiredRole) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieToken = req.cookies?.authToken;

    const token = bearerToken || cookieToken;

    if (!token) return res.status(401).json({ message: 'Não autenticado' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
  };
};
