<?php

namespace App\Models;

use CodeIgniter\Model;

class AnneeScolaireModel extends Model
{
    protected $table            = 'annees_scolaires';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['annee', 'date_debut', 'date_fin', 'statut', 'is_active'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Validation
    protected $validationRules      = [
        'annee'       => 'required|max_length[20]|is_unique[annees_scolaires.annee,id,{id}]',
        'date_debut'  => 'required|valid_date',
        'date_fin'    => 'required|valid_date',
        'statut'      => 'required|in_list[planifie,courante,terminee,archivee]'
    ];
    protected $validationMessages   = [
        'annee' => [
            'required' => 'L\'année scolaire est obligatoire',
            'is_unique' => 'Cette année scolaire existe déjà'
        ],
        'date_debut' => [
            'required' => 'La date de début est obligatoire',
            'valid_date' => 'La date de début n\'est pas valide'
        ],
        'date_fin' => [
            'required' => 'La date de fin est obligatoire',
            'valid_date' => 'La date de fin n\'est pas valide'
        ]
    ];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    /**
     * Récupère toutes les années scolaires triées par date
     */
    public function getAllAnneesScolaires()
    {
        return $this->orderBy('date_debut', 'DESC')->findAll();
    }

    /**
     * Vérifie si une année scolaire est utilisée dans d'autres tables
     */
    public function isUsed($anneeScolaireId)
    {
        $tables = ['classes', 'inscriptions', 'frais_scolarite', 'examens', 'emplois_du_temps'];

        foreach ($tables as $table) {
            $builder = $this->db->table($table);
            $exists = $builder->where('annee_scolaire_id', $anneeScolaireId)->countAllResults() > 0;

            if ($exists) {
                return true;
            }
        }

        return false;
    }

    /**
     * Récupère l'année scolaire active
     */
    public function getActiveYear()
    {
        return $this->where('statut', 'courante')->first();
    }

    public function update($id = null, $data = null): bool
    {
        // Désactiver la validation temporairement pour l'update
        $this->skipValidation(true);
        $result = parent::update($id, $data);
        $this->skipValidation(false);

        return $result;
    }
}
