-- Script pour corriger la fonction attribuer_role_supp
-- Exécutez ce script dans l'éditeur SQL de Supabase

DROP FUNCTION IF EXISTS attribuer_role_supp(uuid, text);
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
