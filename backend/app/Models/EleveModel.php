<?php

namespace App\Models;

use CodeIgniter\Model;

class EleveModel extends Model
{
    protected $table = 'eleves';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'matricule',
        'nom',
        'prenom',
        'date_naissance',
        'lieu_naissance',
        'sexe',
        'adresse',
        'telephone_parent',
        'email_parent',
        'statut',
        'photo'
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'matricule' => 'required|min_length[3]|is_unique[eleves.matricule]',
        'nom' => 'required|min_length[2]|max_length[100]',
        'prenom' => 'required|min_length[2]|max_length[100]',
        'date_naissance' => 'valid_date',
        'sexe' => 'required|in_list[M,F]',
        'email_parent' => 'valid_email',
        'statut' => 'required|in_list[actif,inactif,transfere,diplome]'
    ];

    protected $validationMessages = [
        'matricule' => [
            'is_unique' => 'Ce matricule est déjà utilisé.',
            'required' => 'Le matricule est obligatoire.'
        ],
        'nom' => [
            'required' => 'Le nom est obligatoire.'
        ],
        'prenom' => [
            'required' => 'Le prénom est obligatoire.'
        ]
    ];

    /**
     * Génère un matricule unique
     */
    public function genererMatricule()
    {
        $prefix = 'ELE' . date('Y');
        $last = $this->select('matricule')
            ->like('matricule', $prefix, 'after')
            ->orderBy('id', 'DESC')
            ->first();

        if ($last) {
            $lastNumber = (int) substr($last['matricule'], 7);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Récupère tous les élèves avec pagination et filtres, incluant l'année scolaire
     */
    public function getAllEleves($page = 1, $perPage = 10, $search = '', $statut = '', $anneeScolaireId = null)
    {
        if ($anneeScolaireId) {
            $builder = $this->select('eleves.*, 
                                 classes.nom as classe_nom,
                                 niveaux.nom as niveau_nom,
                                 inscriptions.statut as inscription_statut,
                                 inscriptions.annee_scolaire_id')
                ->join('inscriptions', "inscriptions.eleve_id = eleves.id AND inscriptions.annee_scolaire_id = $anneeScolaireId", 'left')
                ->join('classes', 'classes.id = inscriptions.classe_id', 'left')
                ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left');
        } else {
            $subquery = $this->db->table('inscriptions i1')
                ->select('i1.eleve_id, i1.statut, i1.classe_id, i1.annee_scolaire_id')
                ->where('i1.created_at = (SELECT MAX(i2.created_at) FROM inscriptions i2 WHERE i2.eleve_id = i1.eleve_id)')
                ->getCompiledSelect();

            $builder = $this->select('eleves.*, 
                                 classes.nom as classe_nom,
                                 niveaux.nom as niveau_nom,
                                 latest_inscription.statut as inscription_statut,
                                 latest_inscription.annee_scolaire_id')
                ->join("($subquery) as latest_inscription", 'latest_inscription.eleve_id = eleves.id', 'left')
                ->join('classes', 'classes.id = latest_inscription.classe_id', 'left')
                ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left');
        }

        if (!empty($search)) {
            $builder->groupStart()
                ->like('eleves.nom', $search)
                ->orLike('eleves.prenom', $search)
                ->orLike('eleves.matricule', $search)
                ->orLike('eleves.email_parent', $search)
                ->groupEnd();
        }

        if (!empty($statut)) {
            $builder->where('eleves.statut', $statut);
        }

        return $builder->groupBy('eleves.id')
            ->orderBy('eleves.nom', 'ASC')
            ->orderBy('eleves.prenom', 'ASC')
            ->paginate($perPage, 'default', $page);
    }


    /**
     * Récupère un élève avec ses inscriptions pour une année scolaire spécifique
     */
    public function getEleveWithInscriptions($id, $anneeScolaireId = null)
    {
        $builder = $this->select('eleves.*, 
                                 inscriptions.id as inscription_id, 
                                 inscriptions.classe_id, 
                                 inscriptions.annee_scolaire_id,
                                 inscriptions.date_inscription,
                                 inscriptions.montant_inscription,
                                 inscriptions.montant_paye,
                                 inscriptions.statut as inscription_statut,
                                 classes.nom as classe_nom,
                                 classes.capacite_max,
                                 niveaux.nom as niveau_nom,
                                 niveaux.cycle,
                                 annees_scolaires.annee as annee_scolaire,
                                 annees_scolaires.date_debut,
                                 annees_scolaires.date_fin')
            ->join('inscriptions', 'inscriptions.eleve_id = eleves.id', 'left')
            ->join('classes', 'classes.id = inscriptions.classe_id', 'left')
            ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left')
            ->join('annees_scolaires', 'annees_scolaires.id = inscriptions.annee_scolaire_id', 'left')
            ->where('eleves.id', $id);

        // Filtrer par année scolaire si spécifiée
        if ($anneeScolaireId) {
            $builder->where('inscriptions.annee_scolaire_id', $anneeScolaireId);
        }

        return $builder->orderBy('annees_scolaires.annee', 'DESC')
            ->findAll();
    }

    /**
     * Vérifie si un élève a une inscription active pour une année scolaire
     */
    public function hasActiveInscription($eleveId, $anneeScolaireId)
    {
        return $this->db->table('inscriptions')
            ->where('eleve_id', $eleveId)
            ->where('annee_scolaire_id', $anneeScolaireId)
            ->where('statut', 'inscrit')
            ->countAllResults() > 0;
    }

    /**
     * Récupère l'inscription active d'un élève pour une année scolaire
     */
    public function getActiveInscription($eleveId, $anneeScolaireId)
    {
        return $this->db->table('inscriptions')
            ->select('inscriptions.*, classes.nom as classe_nom, niveaux.nom as niveau_nom')
            ->join('classes', 'classes.id = inscriptions.classe_id')
            ->join('niveaux', 'niveaux.id = classes.niveau_id')
            ->where('inscriptions.eleve_id', $eleveId)
            ->where('inscriptions.annee_scolaire_id', $anneeScolaireId)
            ->where('inscriptions.statut', 'inscrit')
            ->get()
            ->getRowArray();
    }

    /**
     * Statistiques des élèves par année scolaire
     */
    public function getStatistiques($anneeScolaireId = null)
    {
        $stats = [
            'total' => $this->countAll(),
            'actifs' => $this->where('statut', 'actif')->countAllResults(),
            'inactifs' => $this->where('statut', 'inactif')->countAllResults(),
            'transferes' => $this->where('statut', 'transfere')->countAllResults(),
            'diplomes' => $this->where('statut', 'diplome')->countAllResults(),
            'par_sexe' => [
                'M' => $this->where('sexe', 'M')->countAllResults(),
                'F' => $this->where('sexe', 'F')->countAllResults()
            ]
        ];

        // Ajouter les stats par année scolaire si spécifiée
        if ($anneeScolaireId) {
            $stats['inscrits_annee_courante'] = $this->db->table('inscriptions')
                ->where('annee_scolaire_id', $anneeScolaireId)
                ->where('statut', 'inscrit')
                ->countAllResults();
        }

        return $stats;
    }

    /**
     * "Supprime" un élève en changeant son statut (soft delete)
     */
    public function softDelete($id)
    {
        return $this->update($id, [
            'statut' => 'inactif',
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Restaure un élève précédemment "supprimé"
     */
    public function restore($id)
    {
        return $this->update($id, [
            'statut' => 'actif',
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
}
