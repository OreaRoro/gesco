<?php

namespace App\Models;

use CodeIgniter\Model;

class PointageEleveModel extends Model
{
    protected $table = 'pointages_eleves';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'eleve_id',
        'inscription_id',
        'date_pointage',
        'heure_arrivee',
        'heure_depart',
        'statut',
        'remarque',
        'justification',
        'piece_justificative',
        'pointe_par',
        'created_at'
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    // Règles de validation
    protected $validationRules = [
        'eleve_id' => 'required|integer',
        'date_pointage' => 'required|valid_date',
        'statut' => 'required|in_list[present,absent,retard,justifie,exclu]'
    ];

    protected $validationMessages = [
        'statut' => [
            'in_list' => 'Le statut doit être: present, absent, retard, justifie ou exclu'
        ]
    ];

    /**
     * Récupère les pointages d'un élève avec pagination
     */
    public function getPointagesByEleve($eleveId, $filters = [], $perPage = 10, $page = 1)
    {
        $builder = $this->builder('pointages_eleves pe');
        $builder->select('pe.*, u.username as pointe_par_nom, i.classe_id, c.nom as classe_nom, i.annee_scolaire_id');
        $builder->join('users u', 'u.id = pe.pointe_par', 'left');
        $builder->join('inscriptions i', 'i.id = pe.inscription_id', 'left');
        $builder->join('classes c', 'c.id = i.classe_id', 'left');
        $builder->where('pe.eleve_id', $eleveId);

        // Filtres
        if (!empty($filters['date_debut'])) {
            $builder->where('pe.date_pointage >=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $builder->where('pe.date_pointage <=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $builder->where('pe.statut', $filters['statut']);
        }
        if (!empty($filters['classe_id'])) {
            $builder->where('i.classe_id', $filters['classe_id']);
        }
        // Nouveau filtre année scolaire
        if (!empty($filters['annee_scolaire_id'])) {
            $builder->where('i.annee_scolaire_id', $filters['annee_scolaire_id']);
        }

        // Pagination
        $offset = ($page - 1) * $perPage;
        $builder->limit($perPage, $offset);
        $builder->orderBy('pe.date_pointage', 'DESC');

        $pointages = $builder->get()->getResultArray();

        // Total pour la pagination
        $totalBuilder = $this->builder('pointages_eleves pe');
        $totalBuilder->join('inscriptions i', 'i.id = pe.inscription_id', 'left');
        $totalBuilder->where('pe.eleve_id', $eleveId);

        // Appliquer les mêmes filtres
        if (!empty($filters['date_debut'])) {
            $totalBuilder->where('pe.date_pointage >=', $filters['date_debut']);
        }
        if (!empty($filters['date_fin'])) {
            $totalBuilder->where('pe.date_pointage <=', $filters['date_fin']);
        }
        if (!empty($filters['statut'])) {
            $totalBuilder->where('pe.statut', $filters['statut']);
        }
        if (!empty($filters['classe_id'])) {
            $totalBuilder->where('i.classe_id', $filters['classe_id']);
        }
        if (!empty($filters['annee_scolaire_id'])) {
            $totalBuilder->where('i.annee_scolaire_id', $filters['annee_scolaire_id']);
        }

        $total = $totalBuilder->countAllResults();

        return [
            'pointages' => $pointages,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'total_pages' => ceil($total / $perPage),
            'filters_applied' => $filters
        ];
    }

    /**
     * Statistiques d'absences pour un élève
     */
    public function getStatistiquesAbsences($eleveId, $anneeScolaireId = null)
    {
        $builder = $this->builder('pointages_eleves pe');
        $builder->select('
            COUNT(*) as total_jours,
            SUM(CASE WHEN pe.statut = "absent" THEN 1 ELSE 0 END) as absences,
            SUM(CASE WHEN pe.statut = "retard" THEN 1 ELSE 0 END) as retards,
            SUM(CASE WHEN pe.statut = "justifie" THEN 1 ELSE 0 END) as justifies,
            SUM(CASE WHEN pe.statut = "present" THEN 1 ELSE 0 END) as presents,
            SUM(CASE WHEN pe.statut = "exclu" THEN 1 ELSE 0 END) as exclus
        ');
        $builder->join('inscriptions i', 'i.id = pe.inscription_id');
        $builder->where('pe.eleve_id', $eleveId);

        if ($anneeScolaireId) {
            $builder->where('i.annee_scolaire_id', $anneeScolaireId);
        }

        return $builder->get()->getRowArray();
    }

    /**
     * Pointage de masse pour une classe
     */
    public function pointageMasse($classeId, $datePointage, $pointages)
    {
        $this->db->transStart();

        foreach ($pointages as $pointage) {
            $data = [
                'eleve_id' => $pointage['eleve_id'],
                'inscription_id' => $pointage['inscription_id'],
                'date_pointage' => $datePointage,
                'statut' => $pointage['statut'],
                'heure_arrivee' => $pointage['heure_arrivee'] ?? null,
                'heure_depart' => $pointage['heure_depart'] ?? null,
                'remarque' => $pointage['remarque'] ?? null,
                'pointe_par' => $pointage['pointe_par'],
                'created_at' => date('Y-m-d H:i:s')
            ];

            // Vérifier si un pointage existe déjà pour cette date
            $existing = $this->where('eleve_id', $pointage['eleve_id'])
                ->where('date_pointage', $datePointage)
                ->first();

            if ($existing) {
                $this->update($existing['id'], $data);
            } else {
                $this->insert($data);
            }
        }

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    public function getInscriptionCourante($eleveId)
    {
        $anneeModel = new \App\Models\AnneeScolaireModel();
        $anneeCourante = $anneeModel->where('is_active', 1)->first();

        if (!$anneeCourante) {
            return null;
        }

        $inscriptionModel = new \App\Models\InscriptionModel();
        return $inscriptionModel->where('eleve_id', $eleveId)
            ->where('annee_scolaire_id', $anneeCourante['id'])
            ->first();
    }
}
