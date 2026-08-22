-- Script pour vérifier et corriger la fonction pointer_paiement_match
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Vérifier si la fonction existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'pointer_paiement_match';

-- Si la fonction n'existe pas, créez-la
DROP FUNCTION IF EXISTS pointer_paiement_match(text, uuid, uuid);
CREATE OR REPLACE FUNCTION pointer_paiement_match(
  p_telephone text,
  p_paiement_valide_par_utilisateur_id uuid,
  p_paiement_valide_par_role_supp uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_inscription RECORD;
BEGIN
  -- Rechercher l'inscription
  SELECT id, nom, equipe, statut_paiement
  INTO v_inscription
  FROM inscriptions_match
  WHERE telephone = p_telephone;
  
  -- Vérifier si l'inscription existe
  IF v_inscription.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ce numéro n''est pas inscrit pour le match');
  END IF;
  
  -- Vérifier si déjà payé
  IF v_inscription.statut_paiement = 'paye' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paiement déjà validé', 'already_paid', true, 'nom', v_inscription.nom, 'equipe', v_inscription.equipe);
  END IF;
  
  -- Mettre à jour le paiement
  UPDATE inscriptions_match
  SET statut_paiement = 'paye',
      timestamp_paiement = now(),
      paiement_valide_par_utilisateur_id = p_paiement_valide_par_utilisateur_id,
      paiement_valide_par_role_supp = p_paiement_valide_par_role_supp
  WHERE id = v_inscription.id;
  
  -- Retourner le succès
  RETURN jsonb_build_object('success', true, 'status', 'paye', 'nom', v_inscription.nom, 'equipe', v_inscription.equipe);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test rapide de la fonction (commenté par défaut)
-- SELECT pointer_paiement_match('0701020304', '00000000-0000-0000-0000-000000000000'::uuid);
