// api/verify-admin-token.js
// Verifica que un token de admin sea válido y no haya expirado.
// admin.html llama a esta función al cargar para confirmar que
// el usuario realmente pasó por el login, no solo "simuló" el acceso.

const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.body || {};

  if (!token || !token.includes('.')) {
    return res.status(401).json({ valid: false });
  }

  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const [expiryStr, signature] = token.split('.');
  const expiry = Number(expiryStr);

  if (!expiry || Date.now() > expiry) {
    return res.status(401).json({ valid: false, reason: 'expirado' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(String(expiry))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ valid: false, reason: 'firma inválida' });
  }

  return res.status(200).json({ valid: true });
};
