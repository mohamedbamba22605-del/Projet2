/*
# Fix inscrire_joueur_match function

1. Purpose
- Replace the player registration function so it returns the full inserted row data as a structured JSON object instead of a single jsonb variable.

2. Modified function
- `inscrire_joueur_match(text, text, text, text, uuid, uuid)` signature unchanged.
- Now uses individual scalar variables for each returned column and builds a structured `data` object, preventing the "column not found" / shape mismatch error the previous version produced.

3. Data safety
- No tables, rows, or columns are changed. Only the function body is replaced in place.
*/

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