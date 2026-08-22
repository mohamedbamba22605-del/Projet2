-- Script pour corriger la fonction obtenir_utilisateurs_avec_roles_supp
-- Exécutez ce script dans l'éditeur SQL de Supabase

DROP FUNCTION IF EXISTS obtenir_utilisateurs_avec_roles_supp();
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
  GROUP BY u.id, u.prenom, u.role
  ORDER BY u.prenom;
  
  RETURN jsonb_build_object('utilisateurs', COALESCE(v_result, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test de la fonction
SELECT obtenir_utilisateurs_avec_roles_supp();
