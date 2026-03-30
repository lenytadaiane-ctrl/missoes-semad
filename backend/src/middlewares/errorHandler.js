/**
 * Middleware de tratamento de erros global.
 * Interpreta erros do Prisma e retorna respostas padronizadas em pt-BR.
 */
function errorHandler(err, req, res, _next) {
  console.error('[ERRO]', err.message, err.stack);

  // Erros do Prisma
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Registro duplicado.',
          details: `O campo "${err.meta?.target}" já existe no banco de dados.`,
        });
      case 'P2025':
        return res.status(404).json({ error: 'Registro não encontrado.' });
      case 'P2003':
        return res.status(400).json({ error: 'Referência inválida: registro relacionado não encontrado.' });
      case 'P2014':
        return res.status(400).json({ error: 'Violação de relação: não é possível remover este registro pois outros dependem dele.' });
    }
  }

  // Erros de validação do express-validator (array de erros)
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Dados inválidos.', details: err.errors });
  }

  // Multer — arquivo muito grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
  }

  // Multer — tipo de arquivo inválido
  if (err.message === 'TIPO_INVALIDO') {
    return res.status(415).json({ error: 'Formato de imagem não suportado. Use JPG, PNG ou WebP.' });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor.',
  });
}

module.exports = errorHandler;
