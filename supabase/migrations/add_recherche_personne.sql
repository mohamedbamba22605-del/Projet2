-- Script pour ajouter une fonction de recherche de personne par téléphone
-- Exécutez ce script dans l'éditeur SQL de Supabase

DROP FUNCTION IF EXISTS rechercher_personne_par_telephone(text);
CREATE OR REPLACE FUNCTION rechercher_personne_par_telephone(p_telephone text)
RETURNS jsonb AS $$
DECLARE
  v_participant RECORD;
  v_promesse RECORD;
  v_staff RECORD;
  v_spontane RECORD;
  v_result jsonb;
BEGIN
  -- Chercher dans les participants (recruteurs)
  SELECT id, nom, telephone, genre, role_joueur, present, timestamp_pointage, created_at
  INTO v_participant
  FROM participants
  WHERE telephone = p_telephone
  LIMIT 1;
  
  IF v_participant.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'type', 'recruteur',
      'data', jsonb_build_object(
        'id', v_participant.id,
        'nom', v_participant.nom,
        'telephone', v_participant.telephone,
        'genre', v_participant.genre,
        'role_joueur', v_participant.role_joueur,
        'present', v_participant.present,
        'timestamp_pointage', v_participant.timestamp_pointage,
        'created_at', v_participant.created_at
      )
    );
  END IF;
  
  -- Chercher dans les promesses
  SELECT id, nom_personne, telephone, statut, timestamp_enregistrement, timestamp_pointage, recruteur_id
  INTO v_promesse
  FROM promesses
  WHERE telephone = p_telephone
  LIMIT 1;
  
  IF v_promesse.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'type', 'promesse',
      'data', jsonb_build_object(
        'id', v_promesse.id,
        'nom', v_promesse.nom_personne,
        'telephone', v_promesse.telephone,
        'statut', v_promesse.statut,
        'timestamp_enregistrement', v_promesse.timestamp_enregistrement,
        'timestamp_pointage', v_promesse.timestamp_pointage,
        'recruteur_id', v_promesse.recruteur_id
      )
    );
  END IF;
  
  -- Chercher dans les inscriptions staff
  SELECT id, nom, telephone, statut, timestamp_enregistrement, timestamp_pointage, staff_utilisateur_id
  INTO v_staff
  FROM inscriptions_staff
  WHERE telephone = p_telephone
  LIMIT 1;
  
  IF v_staff.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'type', 'staff',
      'data', jsonb_build_object(
        'id', v_staff.id,
        'nom', v_staff.nom,
        'telephone', v_staff.telephone,
        'statut', v_staff.statut,
        'timestamp_enregistrement', v_staff.timestamp_enregistrement,
        'timestamp_pointage', v_staff.timestamp_pointage,
        'staff_utilisateur_id', v_staff.staff_utilisateur_id
      )
    );
  END IF;
  
  -- Chercher dans les donneurs spontanés
  SELECT id, nom, telephone, timestamp_pointage
  INTO v_spontane
  FROM donneurs_spontanes
  WHERE telephone = p_telephone
  LIMIT 1;
  
  IF v_spontane.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'type', 'spontane',
      'data', jsonb_build_object(
        'id', v_spontane.id,
        'nom', v_spontane.nom,
        'telephone', v_spontane.telephone,
        'timestamp_pointage', v_spontane.timestamp_pointage
      )
    );
  END IF;
  
  -- Aucun résultat
  RETURN jsonb_build_object('found', false, 'error', 'Aucune personne trouvée avec ce numéro');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
