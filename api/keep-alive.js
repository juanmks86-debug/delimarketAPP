// api/keep-alive.js
// Endpoint pensado para que un servicio externo de ping (UptimeRobot,
// cron-job.org, etc.) lo visite cada pocos días y genere actividad real
// contra Supabase — así el proyecto free-tier no se pausa por inactividad.
// Solo hace una consulta mínima (cuenta filas de productos), no expone
// datos sensibles.

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btfsppxnfmgtdpagejhh.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ohKv3Wv28a132cpJuN3A1A_B_1tBDjI';

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { count, error } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return res.status(200).json({ ok: true, productos: count, checked_at: new Date().toISOString() });
  } catch (e) {
    console.error('keep-alive error:', e);
    return res.status(500).json({ ok: false, error: 'No se pudo consultar Supabase' });
  }
};
