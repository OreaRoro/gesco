<?php

namespace App\Models;

use CodeIgniter\Model;

class NiveauModel extends Model
{
    protected $table            = 'niveaux';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['nom', 'cycle', 'ordre'];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = null;

    // Validation
    protected $validationRules      = [
        'nom'   => 'required|max_length[50]|is_unique[niveaux.nom,id,{id}]',
        'cycle' => 'required|max_length[50]',
        'ordre' => 'required|integer|greater_than[0]'
    ];
    protected $validationMessages   = [
        'nom' => [
            'required' => 'Le nom du niveau est obligatoire',
            'is_unique' => 'Ce nom de niveau existe déjà'
        ],
        'cycle' => [
            'required' => 'Le cycle est obligatoire'
        ],
        'ordre' => [
            'required' => 'L\'ordre est obligatoire',
            'greater_than' => 'L\'ordre doit être supérieur à 0'
        ]
    ];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    public function update($id = null, $data = null): bool
    {
        if ($id !== null) {
            $this->validationRules['nom'] = "required|max_length[50]|is_unique[niveaux.nom,id,{$id}]";
        }

        return parent::update($id, $data);
    }

    /**
     * Récupère tous les niveaux triés par ordre
     */
    public function getAllNiveaux()
    {
        return $this->orderBy('ordre', 'ASC')->findAll();
    }

    /**
     * Vérifie si un niveau est utilisé dans des classes
     */
    public function isUsed($niveauId)
    {
        $builder = $this->db->table('classes');
        return $builder->where('niveau_id', $niveauId)->countAllResults() > 0;
    }

    /**
     * Récupère la liste des cycles disponibles
     */
    public function getCycles()
    {
        $builder = $this->db->table($this->table);
        $builder->select('cycle')->distinct();
        $result = $builder->get()->getResultArray();

        return array_column($result, 'cycle');
    }

    /**
     * Récupère les niveaux par cycle
     */
    public function getByCycle($cycle)
    {
        return $this->where('cycle', $cycle)->orderBy('ordre', 'ASC')->findAll();
    }
}
