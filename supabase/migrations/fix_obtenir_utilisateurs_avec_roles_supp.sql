-- Script pour corriger la fonction obtenir_utilisateurs_avec_roles_supp
-- Exécutez ce script dans l'éditeur SQL de Supabase

DROP FUNCTION IF EXISTS obtenir_utilisateurs_avec_roles_supp();
CREATE OR REPLACE FUNCTION obtenir_utilisateurs_avec_roles_supp()
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'utilisateurs', 
      (
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
        ) FROM utilisateurs u
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test de la fonction
SELECT obtenir_utilisateurs_avec_roles_supp();
