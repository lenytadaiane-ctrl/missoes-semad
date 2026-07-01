'use strict';
const jwt = require('jsonwebtoken');

async function login(req, res, next) {
  try {
    const { usuario, senha } = req.body;
    if (!usuario || !senha) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

    let role = null;
    if (usuario === process.env.USUARIO_MASTER && senha === process.env.SENHA_MASTER) role = 'MASTER';
    else if (usuario === process.env.USUARIO_VIEWER && senha === process.env.SENHA_VIEWER) role = 'VIEWER';

    if (!role) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ usuario, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role, usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
