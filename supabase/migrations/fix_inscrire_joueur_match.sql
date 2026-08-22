-- Script pour corriger la fonction inscrire_joueur_match
-- Exécutez ce script dans l'éditeur SQL de Supabase

DROP FUNCTION IF EXISTS inscrire_joueur_match(text, text, text, text, uuid, uuid);
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
