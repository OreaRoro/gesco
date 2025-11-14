-- Insertion d'un administrateur par défaut si non existant
INSERT IGNORE INTO `personnel` (`id`, `matricule`, `nom`, `prenom`, `type_personnel`, `date_embauche`, `statut`) VALUES
(1, 'ADMIN001', 'Admin', 'System', 'direction', CURDATE(), 'actif');

INSERT IGNORE INTO `users` (`id`, `username`, `password`, `email`, `role`, `personnel_id`, `is_active`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@ecole.edu', 'admin', 1, 1);

-- Le mot de passe est "password"