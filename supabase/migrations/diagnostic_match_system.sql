-- Script de diagnostic complet pour le système de match
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier si la table roles_supplementaires existe
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles_supplementaires'
  ) as table_roles_supp_exists;

-- 2. Vérifier si la table inscriptions_match existe
SELECT 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'inscriptions_match'
  ) as table_inscriptions_match_exists;

-- 3. Vérifier le contenu de la table roles_supplementaires
SELECT 'Contenu de roles_supplementaires:' as info;
SELECT 
  rs.id,
  rs.utilisateur_id,
  rs.role_supp,
  rs.created_at,
  u.prenom,
  u.role as role_principal
FROM roles_supplementaires rs
LEFT JOIN utilisateurs u ON rs.utilisateur_id = u.id
ORDER BY u.prenom, rs.role_supp;

-- 4. Vérifier si les fonctions existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'attribuer_role_supp', 
    'supprimer_role_supp', 
    'obtenir_roles_supp', 
    'obtenir_utilisateurs_avec_roles_supp',
    'inscrire_joueur_match',
    'pointer_paiement_match'
  )
ORDER BY routine_name;

-- 5. Vérifier tous les utilisateurs avec leurs rôles principaux
SELECT 'Tous les utilisateurs:' as info;
SELECT id, prenom, role FROM utilisateurs ORDER BY prenom;

-- 6. Essayer d'attribuer un rôle manuellement pour tester (commenté)
-- Trouvez d'abord l'ID d'Elcine dans la table utilisateurs, puis décommentez cette ligne:
-- SELECT attribuer_role_supp('ID_ELCINE_ICI'::uuid, 'treasurer');
