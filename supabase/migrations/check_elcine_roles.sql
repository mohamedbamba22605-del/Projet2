-- Script pour vérifier les rôles d'Elcine
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Trouver l'ID d'Elcine
SELECT id, prenom, role FROM utilisateurs WHERE prenom ILIKE '%elcine%';

-- 2. Vérifier les rôles supplémentaires pour Elcine
SELECT 
  rs.id,
  rs.utilisateur_id,
  rs.role_supp,
  rs.created_at,
  u.prenom
FROM roles_supplementaires rs
JOIN utilisateurs u ON rs.utilisateur_id = u.id
WHERE u.prenom ILIKE '%elcine%';

-- 3. Vérifier tous les rôles supplémentaires existants
SELECT 
  rs.id,
  rs.utilisateur_id,
  rs.role_supp,
  rs.created_at,
  u.prenom
FROM roles_supplementaires rs
JOIN utilisateurs u ON rs.utilisateur_id = u.id
ORDER BY u.prenom, rs.role_supp;

-- 4. Tester la fonction obtenir_roles_supp pour Elcine
-- Remplacez l'UUID par l'ID d'Elcine trouvé dans la première requête
-- SELECT obtenir_roles_supp('VOTRE_UUID_ELCINE'::uuid);
