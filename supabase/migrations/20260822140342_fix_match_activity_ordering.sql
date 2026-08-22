/*
# Fix Match role listing ordering

1. Purpose
- Correct the role-management function so it can order users by first name while building the JSON array.

2. Modified function
- `obtenir_utilisateurs_avec_roles_supp()` keeps the same return format and role data.
- User ordering is now applied inside `jsonb_agg`, avoiding PostgreSQL's aggregate/order validation error.

3. Data safety
- No tables, rows, or columns are changed.
- The existing function is replaced in place.
*/

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
        (
          SELECT jsonb_agg(jsonb_build_object('role', rs.role_supp, 'id', rs.id))
          FROM roles_supplementaires rs
          WHERE rs.utilisateur_id = u.id
        ),
        '[]'::jsonb
      )
    )
    ORDER BY u.prenom
  )
  INTO v_result
  FROM utilisateurs u;

  RETURN jsonb_build_object('utilisateurs', COALESCE(v_result, '[]'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;