'use strict';

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Registro duplicado. Verifique os campos únicos.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origem não permitida.' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
}

module.exports = errorHandler;
