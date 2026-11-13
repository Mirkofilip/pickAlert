import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[PickAlert] Variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti. " +
      "Copia .env.example in .env e inserisci le credenziali del tuo progetto Supabase.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
