-- Script pour tester la fonction obtenir_roles_supp pour Elcine
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- D'abord, récupérez l'ID d'Elcine (depuis le résultat précédent)
-- Ensuite, exécutez cette requête en remplaçant l'UUID par celui d'Elcine

-- Remplacez 'VOTRE_UUID_ELCINE' par l'UUID réel d'Elcine
SELECT obtenir_roles_supp('VOTRE_UUID_ELCINE'::uuid);

-- Alternative : si vous avez l'UUID d'Elcine, testez directement
-- Exemple: SELECT obtenir_roles_supp('123e4567-e89b-12d3-a456-426614174000'::uuid);
