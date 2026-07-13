// Conexión a Supabase
// Este archivo se puede subir a GitHub sin problema: la "publishable key"
// está diseñada para usarse en el navegador (no es secreta).
// La "secret key" NUNCA debe ir acá ni en ningún archivo del frontend.

const SUPABASE_URL = 'https://btfsppxnfmgtdpagejhh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ohKv3Wv28a132cpJuN3A1A_B_1tBDjI'; // sb_publishable_...

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
