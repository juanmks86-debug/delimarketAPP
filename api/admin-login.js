// api/admin-login.js
// Valida la contraseña de administrador EN EL SERVIDOR (no en el navegador).
// La contraseña real vive en la variable de entorno ADMIN_PASSWORD de Vercel,
// nunca en este archivo ni en el código que llega al navegador.

const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Falta la contraseña' });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET    = process.env.ADMIN_SECRET;

  if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
    // Si esto aparece, faltan configurar las variables de entorno en Vercel
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
  }

  // Generamos un token temporal firmado, válido por 4 horas
  const expiry = Date.now() + 4 * 60 * 60 * 1000; // 4 horas
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(String(expiry))
    .digest('hex');

  const token = `${expiry}.${signature}`;

  return res.status(200).json({ success: true, token });
};
