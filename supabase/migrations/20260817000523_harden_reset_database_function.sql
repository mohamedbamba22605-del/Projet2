-- Harden reset_database: pin search_path (security advisor) and make it robust.
-- Behavior is unchanged: clears event data, keeps organisateur accounts, resets match_config.

CREATE OR REPLACE FUNCTION reset_database()
RETURNS jsonb AS $$
BEGIN
  DELETE FROM donneurs_spontanes;
  DELETE FROM promesses;
  DELETE FROM inscriptions_staff;
  DELETE FROM participants;
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
