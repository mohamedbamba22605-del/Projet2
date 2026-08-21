/*
# Match Activity Schema - Parallèle au Don de Sang

## Overview
Ajout de la gestion de l'activité du match (football) parallèlement au don de sang
- Rôles supplémentaires : Trésorier, Contrôleur
- Inscriptions match : gestion des joueurs inscrits pour le match
- Pointage match : contrôle de paiement le jour du match
- Indépendance complète avec le système de don de sang

## Nouvelles Tables

1. `roles_supplementaires` — Rôles supplémentaires des utilisateurs
   - utilisateur_id (FK utilisateurs)
   - role_supp (treasurer, controller)
   - created_at

2. `inscriptions_match` — Inscriptions pour l'activité match
   - id, nom, telephone (unique SEULEMENT dans cette table)
   - equipe (garcons, filles)
   - role_joueur (joueur, spectateur)
   - statut_paiement (non_paye, paye)
   - inscrit_par_utilisateur_id (FK utilisateurs)
   - inscrit_par_role_supp (FK roles_supplementaires)
   - timestamp_inscription, timestamp_paiement
   - paiement_valide_par_utilisateur_id (FK utilisateurs)
   - paiement_valide_par_role_supp (FK roles_supplementaires)

## Règles métier
- Un utilisateur peut avoir un rôle supplémentaire en plus de son rôle principal
- Les téléphones dans inscriptions_match sont uniques UNIQUEMENT dans cette table
- Pas de restriction avec les autres tables (participants, promesses, etc.)
- Le pointage match est fait par le trésorier ou les contrôleurs
*/

-- ============================================================
-- 1. NOUVELLES TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS roles_supplementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id uuid NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  role_supp text NOT NULL CHECK (role_supp IN ('treasurer', 'controller')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(utilisateur_id, role_supp)
);

CREATE TABLE IF NOT EXISTS inscriptions_match (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  telephone text NOT NULL,
  equipe text NOT NULL CHECK (equipe IN ('garcons', 'filles')),
  role_joueur text NOT NULL CHECK (role_joueur IN ('joueur', 'spectateur')),
  statut_paiement text NOT NULL DEFAULT 'non_paye' CHECK (statut_paiement IN ('non_paye', 'paye')),
  inscrit_par_utilisateur_id uuid REFERENCES utilisateurs(id) ON DELETE SET NULL,
  inscrit_par_role_supp uuid REFERENCES roles_supplementaires(id) ON DELETE SET NULL,
  timestamp_inscription timestamptz DEFAULT now(),
  timestamp_paiement timestamptz,
  paiement_valide_par_utilisateur_id uuid REFERENCES utilisateurs(id) ON DELETE SET NULL,
  paiement_valide_par_role_supp uuid REFERENCES roles_supplementaires(id) ON DELETE SET NULL,
  UNIQUE(telephone)
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_roles_supplementaires_utilisateur ON roles_supplementaires(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_roles_supplementaires_role ON roles_supplementaires(role_supp);
CREATE INDEX IF NOT EXISTS idx_inscriptions_match_equipe ON inscriptions_match(equipe);
CREATE INDEX IF NOT EXISTS idx_inscriptions_match_statut_paiement ON inscriptions_match(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_inscriptions_match_inscrit_par ON inscriptions_match(inscrit_par_utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_match_role_supp ON inscriptions_match(inscrit_par_role_supp);

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================

ALTER TABLE roles_supplementaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions_match ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLICIES
-- ============================================================

-- roles_supplementaires: full CRUD
DROP POLICY IF EXISTS "anon_select_roles_supplementaires" ON roles_supplementaires;
CREATE POLICY "anon_select_roles_supplementaires" ON roles_supplementaires FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_roles_supplementaires" ON roles_supplementaires;
CREATE POLICY "anon_insert_roles_supplementaires" ON roles_supplementaires FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_roles_supplementaires" ON roles_supplementaires;
CREATE POLICY "anon_update_roles_supplementaires" ON roles_supplementaires FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_roles_supplementaires" ON roles_supplementaires;
CREATE POLICY "anon_delete_roles_supplementaires" ON roles_supplementaires FOR DELETE
  TO anon, authenticated USING (true);

-- inscriptions_match: full CRUD
DROP POLICY IF EXISTS "anon_select_inscriptions_match" ON inscriptions_match;
CREATE POLICY "anon_select_inscriptions_match" ON inscriptions_match FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inscriptions_match" ON inscriptions_match;
CREATE POLICY "anon_insert_inscriptions_match" ON inscriptions_match FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inscriptions_match" ON inscriptions_match;
CREATE POLICY "anon_update_inscriptions_match" ON inscriptions_match FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inscriptions_match" ON inscriptions_match;
CREATE POLICY "anon_delete_inscriptions_match" ON inscriptions_match FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. FONCTIONS
-- ============================================================

-- attribuer_role_supp: attribue un rôle supplémentaire à un utilisateur
CREATE OR REPLACE FUNCTION attribuer_role_supp(p_utilisateur_id uuid, p_role_supp text)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO roles_supplementaires (utilisateur_id, role_supp)
  VALUES (p_utilisateur_id, p_role_supp)
  RETURNING id, utilisateur_id, role_supp, created_at
  INTO v_result;
  
  RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cet utilisateur a déjà ce rôle supplémentaire');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- supprimer_role_supp: supprime un rôle supplémentaire
CREATE OR REPLACE FUNCTION supprimer_role_supp(p_utilisateur_id uuid, p_role_supp text)
RETURNS jsonb AS $$
BEGIN
  DELETE FROM roles_supplementaires 
  WHERE utilisateur_id = p_utilisateur_id AND role_supp = p_role_supp;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- obtenir_roles_supp: obtient les rôles supplémentaires d'un utilisateur
CREATE OR REPLACE FUNCTION obtenir_roles_supp(p_utilisateur_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_roles jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('role', role_supp, 'id', id, 'created_at', created_at))
  INTO v_roles
  FROM roles_supplementaires
  WHERE utilisateur_id = p_utilisateur_id;
  
  RETURN jsonb_build_object('roles', COALESCE(v_roles, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- obtenir_utilisateurs_avec_roles_supp: obtient tous les utilisateurs avec leurs rôles supplémentaires
CREATE OR REPLACE FUNCTION obtenir_utilisateurs_avec_roles_supp()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'prenom', u.prenom,
      'role_principal', u.role,
      'roles_supp', COALESCE(
        (SELECT jsonb_agg(jsonb_build_object('role', rs.role_supp, 'id', rs.id))
         FROM roles_supplementaires rs WHERE rs.utilisateur_id = u.id),
        '[]'::jsonb
      )
    )
  ) INTO v_result
  FROM utilisateurs u
  ORDER BY u.prenom;
  
  RETURN jsonb_build_object('utilisateurs', COALESCE(v_result, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- inscrire_joueur_match: inscrit un joueur pour le match
CREATE OR REPLACE FUNCTION inscrire_joueur_match(
  p_nom text,
  p_telephone text,
  p_equipe text,
  p_role_joueur text,
  p_inscrit_par_utilisateur_id uuid,
  p_inscrit_par_role_supp uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO inscriptions_match (
    nom, telephone, equipe, role_joueur,
    inscrit_par_utilisateur_id, inscrit_par_role_supp
  )
  VALUES (
    p_nom, p_telephone, p_equipe, p_role_joueur,
    p_inscrit_par_utilisateur_id, p_inscrit_par_role_supp
  )
  RETURNING id, nom, telephone, equipe, role_joueur, statut_paiement, timestamp_inscription
  INTO v_result;
  
  RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce numéro de téléphone est déjà inscrit pour le match');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pointer_paiement_match: valide le paiement d'un joueur pour le match
CREATE OR REPLACE FUNCTION pointer_paiement_match(
  p_telephone text,
  p_paiement_valide_par_utilisateur_id uuid,
  p_paiement_valide_par_role_supp uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_inscription RECORD;
BEGIN
  SELECT id, nom, equipe, statut_paiement
  INTO v_inscription
  FROM inscriptions_match
  WHERE telephone = p_telephone;
  
  IF v_inscription.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce numéro n''est pas inscrit pour le match');
  END IF;
  
  IF v_inscription.statut_paiement = 'paye' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paiement déjà validé', 'already_paid', true, 'nom', v_inscription.nom, 'equipe', v_inscription.equipe);
  END IF;
  
  UPDATE inscriptions_match
  SET statut_paiement = 'paye',
      timestamp_paiement = now(),
      paiement_valide_par_utilisateur_id = p_paiement_valide_par_utilisateur_id,
      paiement_valide_par_role_supp = p_paiement_valide_par_role_supp
  WHERE id = v_inscription.id;
  
  RETURN jsonb_build_object('success', true, 'status', 'paye', 'nom', v_inscription.nom, 'equipe', v_inscription.equipe);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- obtenir_stats_match: obtient les statistiques du match
CREATE OR REPLACE FUNCTION obtenir_stats_match()
RETURNS jsonb AS $$
DECLARE
  v_total_garcons int;
  v_total_filles int;
  v_payes_garcons int;
  v_payes_filles int;
  v_non_payes_garcons int;
  v_non_payes_filles int;
BEGIN
  SELECT COUNT(*) INTO v_total_garcons FROM inscriptions_match WHERE equipe = 'garcons';
  SELECT COUNT(*) INTO v_total_filles FROM inscriptions_match WHERE equipe = 'filles';
  
  SELECT COUNT(*) INTO v_payes_garcons FROM inscriptions_match WHERE equipe = 'garcons' AND statut_paiement = 'paye';
  SELECT COUNT(*) INTO v_payes_filles FROM inscriptions_match WHERE equipe = 'filles' AND statut_paiement = 'paye';
  
  SELECT COUNT(*) INTO v_non_payes_garcons FROM inscriptions_match WHERE equipe = 'garcons' AND statut_paiement = 'non_paye';
  SELECT COUNT(*) INTO v_non_payes_filles FROM inscriptions_match WHERE equipe = 'filles' AND statut_paiement = 'non_paye';
  
  RETURN jsonb_build_object(
    'total_garcons', v_total_garcons,
    'total_filles', v_total_filles,
    'payes_garcons', v_payes_garcons,
    'payes_filles', v_payes_filles,
    'non_payes_garcons', v_non_payes_garcons,
    'non_payes_filles', v_non_payes_filles,
    'total_inscrits', v_total_garcons + v_total_filles,
    'total_payes', v_payes_garcons + v_payes_filles,
    'total_non_payes', v_non_payes_garcons + v_non_payes_filles
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- obtenir_inscriptions_match_utilisateur: obtient les inscriptions match d'un utilisateur
CREATE OR REPLACE FUNCTION obtenir_inscriptions_match_utilisateur(p_utilisateur_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nom', nom,
      'telephone', telephone,
      'equipe', equipe,
      'role_joueur', role_joueur,
      'statut_paiement', statut_paiement,
      'timestamp_inscription', timestamp_inscription,
      'timestamp_paiement', timestamp_paiement
    )
  ) INTO v_result
  FROM inscriptions_match
  WHERE inscrit_par_utilisateur_id = p_utilisateur_id;
  
  RETURN jsonb_build_object('inscriptions', COALESCE(v_result, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
