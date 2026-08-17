-- Fix: "DELETE requires a WHERE clause" error on reset.
-- Replace unconditional DELETE FROM ... with TRUNCATE for the data tables.
-- TRUNCATE is more efficient for full-table clears and avoids any PostgREST
-- safety checks that may inspect function bodies for unfiltered DELETEs.
-- utilisateurs still uses DELETE with a WHERE clause (keeps organisateur accounts).

CREATE OR REPLACE FUNCTION reset_database()
RETURNS jsonb AS $$
BEGIN
  TRUNCATE donneurs_spontanes, promesses, inscriptions_staff, participants;
  DELETE FROM utilisateurs WHERE role != 'organisateur';
  UPDATE match_config
    SET score_bonus_garcons = 0,
        score_bonus_filles = 0,
        objectif_global = 50
    WHERE id = 1;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Base réinitialisée',
    'remaining_participants', (SELECT COUNT(*) FROM participants),
    'remaining_utilisateurs', (SELECT COUNT(*) FROM utilisateurs)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION reset_database() TO anon, authenticated;
