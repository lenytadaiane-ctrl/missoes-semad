const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  const USUARIOS = {
    [process.env.USUARIO_MASTER]: { senha: process.env.SENHA_MASTER, role: 'MASTER' },
    [process.env.USUARIO_VIEWER]: { senha: process.env.SENHA_VIEWER, role: 'VIEWER' },
  };

  const user = USUARIOS[usuario];
  if (!user || user.senha !== senha) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign(
    { usuario, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, role: user.role, usuario });
};
