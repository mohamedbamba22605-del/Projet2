-- Script pour vérifier les rôles supplémentaires
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier les rôles supplémentaires existants
SELECT 
  rs.id,
  rs.utilisateur_id,
  rs.role_supp,
  rs.created_at,
  u.prenom,
  u.role as role_principal
FROM roles_supplementaires rs
JOIN utilisateurs u ON rs.utilisateur_id = u.id
ORDER BY u.prenom, rs.role_supp;

-- 2. Tester la fonction obtenir_roles_supp pour un utilisateur spécifique
-- Remplacez l'UUID par l'ID d'un utilisateur qui devrait avoir des rôles
-- SELECT obtenir_roles_supp('VOTRE_UUID_ICI'::uuid);

-- 3. Vérifier si les utilisateurs existent
SELECT id, prenom, role FROM utilisateurs ORDER BY prenom;
