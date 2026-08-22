-- Script complet pour recréer le système de match
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Cela va recréer toutes les tables et fonctions nécessaires

-- 1. Supprimer les anciennes fonctions et tables si elles existent
DROP FUNCTION IF EXISTS attribuer_role_supp(uuid, text);
DROP FUNCTION IF EXISTS supprimer_role_supp(uuid, text);
DROP FUNCTION IF EXISTS obtenir_roles_supp(uuid);
DROP FUNCTION IF EXISTS obtenir_utilisateurs_avec_roles_supp();
DROP FUNCTION IF EXISTS inscrire_joueur_match(text, text, text, text, uuid, uuid);
DROP FUNCTION IF EXISTS pointer_paiement_match(text, uuid, uuid);
DROP FUNCTION IF EXISTS obtenir_stats_match();
DROP FUNCTION IF EXISTS obtenir_inscriptions_match_utilisateur(uuid);

DROP TABLE IF EXISTS inscriptions_match CASCADE;
DROP TABLE IF EXISTS roles_supplementaires CASCADE;

-- 2. Créer la table roles_supplementaires
CREATE TABLE roles_supplementaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id uuid NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  role_supp text NOT NULL CHECK (role_supp IN ('treasurer', 'controller')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(utilisateur_id, role_supp)
);

-- 3. Créer la table inscriptions_match
CREATE TABLE inscriptions_match (
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

-- 4. Créer les indexes
CREATE INDEX idx_roles_supplementaires_utilisateur ON roles_supplementaires(utilisateur_id);
CREATE INDEX idx_roles_supplementaires_role ON roles_supplementaires(role_supp);
CREATE INDEX idx_inscriptions_match_equipe ON inscriptions_match(equipe);
CREATE INDEX idx_inscriptions_match_statut_paiement ON inscriptions_match(statut_paiement);
CREATE INDEX idx_inscriptions_match_inscrit_par ON inscriptions_match(inscrit_par_utilisateur_id);
CREATE INDEX idx_inscriptions_match_role_supp ON inscriptions_match(inscrit_par_role_supp);

-- 5. Activer RLS
ALTER TABLE roles_supplementaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions_match ENABLE ROW LEVEL SECURITY;

-- 6. Créer les policies
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

-- 7. Créer les fonctions

-- attribuer_role_supp
CREATE OR REPLACE FUNCTION attribuer_role_supp(p_utilisateur_id uuid, p_role_supp text)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
  v_utilisateur_id uuid;
  v_role_supp text;
  v_created_at timestamptz;
BEGIN
  INSERT INTO roles_supplementaires (utilisateur_id, role_supp)
  VALUES (p_utilisateur_id, p_role_supp)
  RETURNING id, utilisateur_id, role_supp, created_at
  INTO v_id, v_utilisateur_id, v_role_supp, v_created_at;
  
  RETURN jsonb_build_object(
    'success', true, 
    'data', jsonb_build_object(
      'id', v_id,
      'utilisateur_id', v_utilisateur_id,
      'role_supp', v_role_supp,
      'created_at', v_created_at
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cet utilisateur a déjà ce rôle supplémentaire');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- supprimer_role_supp
CREATE OR REPLACE FUNCTION supprimer_role_supp(p_utilisateur_id uuid, p_role_supp text)
RETURNS jsonb AS $$
BEGIN
  DELETE FROM roles_supplementaires 
  WHERE utilisateur_id = p_utilisateur_id AND role_supp = p_role_supp;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- obtenir_roles_supp
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

-- obtenir_utilisateurs_avec_roles_supp
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

-- inscrire_joueur_match
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
  v_id uuid;
  v_nom text;
  v_telephone text;
  v_equipe text;
  v_role_joueur text;
  v_statut_paiement text;
  v_timestamp_inscription timestamptz;
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
  INTO v_id, v_nom, v_telephone, v_equipe, v_role_joueur, v_statut_paiement, v_timestamp_inscription;
  
  RETURN jsonb_build_object(
    'success', true, 
    'data', jsonb_build_object(
      'id', v_id,
      'nom', v_nom,
      'telephone', v_telephone,
      'equipe', v_equipe,
      'role_joueur', v_role_joueur,
      'statut_paiement', v_statut_paiement,
      'timestamp_inscription', v_timestamp_inscription
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce numéro de téléphone est déjà inscrit pour le match');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pointer_paiement_match
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

-- obtenir_stats_match
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

-- obtenir_inscriptions_match_utilisateur
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

-- Message de succès
SELECT 'Système de match recréé avec succès !' as status;
