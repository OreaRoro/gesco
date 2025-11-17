<?php

namespace App\Models;

use CodeIgniter\Model;

class SalaireModel extends Model
{
    protected $table            = 'salaires';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'personnel_id',
        'annee_scolaire_id',
        'mois',
        'salaire_base',
        'prime',
        'heures_supp',
        'taux_heure_supp',
        'deduction',
        'salaire_net',
        'statut_paiement',
        'date_paiement',
        'paye_par'
    ];

    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'personnel_id' => 'required|integer',
        'annee_scolaire_id' => 'required|integer',
        'mois' => 'required|regex_match[/^\d{4}-\d{2}$/]', // Format YYYY-MM
        'salaire_base' => 'required|decimal',
        'salaire_net' => 'required|decimal',
        'statut_paiement' => 'required|in_list[paye,impaye]'
    ];

    protected $validationMessages = [
        'mois' => [
            'regex_match' => 'Le format du mois doit être YYYY-MM (ex: 2025-01)'
        ]
    ];

    protected $skipValidation     = false;

    public function getFiltered(array $filters = [])
    {
        $builder = $this->builder();
        $builder->select('salaires.*, 
                         personnel.nom as personnel_nom, 
                         personnel.prenom as personnel_prenom, 
                         personnel.matricule as personnel_matricule,
                         personnel.type_personnel as personnel_type,
                         personnel.salaire_base as personnel_salaire_base')
            ->join('personnel', 'personnel.id = salaires.personnel_id');

        if (!empty($filters['mois'])) {
            $builder->where('salaires.mois', $filters['mois']);
        }

        if (!empty($filters['annee_scolaire_id'])) {
            $builder->where('salaires.annee_scolaire_id', $filters['annee_scolaire_id']);
        }

        if (!empty($filters['personnel_id'])) {
            $builder->where('salaires.personnel_id', $filters['personnel_id']);
        }

        if (!empty($filters['statut_paiement'])) {
            $builder->where('salaires.statut_paiement', $filters['statut_paiement']);
        }

        if (!empty($filters['type_personnel'])) {
            $builder->where('personnel.type_personnel', $filters['type_personnel']);
        }

        $builder->orderBy('salaires.mois', 'DESC');
        $builder->orderBy('personnel.nom', 'ASC');

        return $builder->get()->getResultArray();
    }

    public function getWithPersonnel($id)
    {
        $builder = $this->builder();
        $builder->select('salaires.*, 
                         personnel.nom, 
                         personnel.prenom, 
                         personnel.matricule,
                         personnel.type_personnel')
            ->join('personnel', 'personnel.id = salaires.personnel_id')
            ->where('salaires.id', $id);

        return $builder->get()->getRowArray();
    }
}
