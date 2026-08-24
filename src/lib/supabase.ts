import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type Role = 'organisateur' | 'mobilisateur' | 'staff';
export type RoleSupplementaire = 'treasurer' | 'controller';

export interface Utilisateur {
  id: string;
  prenom: string;
  role: Role;
}

export interface Participant {
  id: string;
  nom: string;
  telephone: string;
  genre: 'M' | 'F';
  role_joueur: 'joueur' | 'spectateur';
  present: boolean;
  timestamp_pointage: string | null;
  saisi_par_utilisateur_id: string | null;
  created_at: string;
}

export interface Promesse {
  id: string;
  recruteur_id: string;
  nom_personne: string;
  telephone: string;
  statut: 'en_attente' | 'presente' | 'en_litige';
  saisi_par_utilisateur_id: string | null;
  timestamp_enregistrement: string;
  timestamp_pointage: string | null;
}

export interface InscriptionStaff {
  id: string;
  staff_utilisateur_id: string | null;
  nom: string;
  telephone: string;
  statut: 'en_attente' | 'presente';
  timestamp_enregistrement: string;
  timestamp_pointage: string | null;
}

export interface DonneurSpontane {
  id: string;
  nom: string | null;
  telephone: string;
  timestamp_pointage: string;
}

export interface MatchConfig {
  id: number;
  score_bonus_garcons: number;
  score_bonus_filles: number;
  objectif_global: number;
}

export interface DashboardStats {
  bonusGarcons: number;
  bonusFilles: number;
  objectif: number;
  mobilisationGarcons: number;
  mobilisationFilles: number;
  promessesPresentesGarcons: number;
  promessesPresentesFilles: number;
  recruteursPresentsGarcons: number;
  recruteursPresentsFilles: number;
  staffPresentes: number;
  spontanes: number;
  scoreGarcons: number;
  scoreFilles: number;
  totalPresent: number;
  totalPromesses: number;
  totalInscriptions: number;
}

export interface CheckResult {
  exists: boolean;
  source?: string;
  nom?: string;
  genre?: string;
  recruteur?: string;
}

export interface PointageResult {
  status: 'success' | 'already_pointed';
  type: 'recruteur' | 'promesse' | 'staff' | 'spontane';
  nom: string;
  equipe?: string;
  recruteur?: string;
}

export interface RecherchePersonneResult {
  found: boolean;
  type?: 'recruteur' | 'promesse' | 'staff' | 'spontane';
  data?: any;
  error?: string;
}

// Match Activity Interfaces
export interface RoleSupplementaire {
  id: string;
  utilisateur_id: string;
  role_supp: RoleSupplementaire;
  created_at: string;
}

export interface InscriptionMatch {
  id: string;
  nom: string;
  telephone: string;
  equipe: 'garcons' | 'filles';
  role_joueur: 'joueur' | 'spectateur';
  statut_paiement: 'non_paye' | 'paye';
  inscrit_par_utilisateur_id: string | null;
  inscrit_par_role_supp: string | null;
  timestamp_inscription: string;
  timestamp_paiement: string | null;
  paiement_valide_par_utilisateur_id: string | null;
  paiement_valide_par_role_supp: string | null;
}

export interface MatchStats {
  total_garcons: number;
  total_filles: number;
  payes_garcons: number;
  payes_filles: number;
  non_payes_garcons: number;
  non_payes_filles: number;
  total_inscrits: number;
  total_payes: number;
  total_non_payes: number;
}

export interface PaiementMatchResult {
  success: boolean;
  status?: 'paye';
  nom?: string;
  equipe?: string;
  error?: string;
  already_paid?: boolean;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.()]/g, '').replace(/^\+226/, '');
}
