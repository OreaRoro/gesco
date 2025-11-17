<?php

namespace App\Models;

use CodeIgniter\Model;

class MatiereModel extends Model
{
    protected $table            = 'matieres';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['nom', 'code', 'coefficient', 'niveau_id', 'created_at'];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Validation
    protected $validationRules = [
        'nom' => 'required|min_length[2]|max_length[100]',
        'code' => 'required|alpha_numeric|max_length[20]|is_unique[matieres.code,id,{id}]',
        'coefficient' => 'required|integer|greater_than[0]|less_than[6]',
        'niveau_id' => 'required|integer'
    ];

    protected $validationMessages = [
        'nom' => [
            'required' => 'Le nom de la matière est obligatoire',
            'min_length' => 'Le nom doit contenir au moins 2 caractères',
            'max_length' => 'Le nom ne peut pas dépasser 100 caractères'
        ],
        'code' => [
            'required' => 'Le code de la matière est obligatoire',
            'alpha_numeric' => 'Le code ne doit contenir que des lettres et chiffres',
            'max_length' => 'Le code ne peut pas dépasser 20 caractères',
            'is_unique' => 'Ce code de matière est déjà utilisé'
        ],
        'coefficient' => [
            'required' => 'Le coefficient est obligatoire',
            'integer' => 'Le coefficient doit être un nombre entier',
            'greater_than' => 'Le coefficient doit être supérieur à 0',
            'less_than' => 'Le coefficient ne peut pas dépasser 5'
        ],
        'niveau_id' => [
            'required' => 'Le niveau est obligatoire',
            'integer' => 'Le niveau doit être un identifiant valide'
        ]
    ];

    protected $skipValidation = false;
    protected $cleanValidationRules = true;

    /**
     * Récupère toutes les matières avec leurs niveaux
     */
    public function getAllWithNiveau($filters = [])
    {
        $builder = $this->select('matieres.*, niveaux.nom as niveau_nom')
            ->join('niveaux', 'niveaux.id = matieres.niveau_id', 'left');

        // Filtre par recherche
        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('matieres.nom', $filters['search'])
                ->orLike('matieres.code', $filters['search'])
                ->groupEnd();
        }

        // Filtre par niveau
        if (!empty($filters['niveau_id'])) {
            $builder->where('matieres.niveau_id', $filters['niveau_id']);
        }

        return $builder->orderBy('matieres.nom', 'ASC')
            ->findAll();
    }

    public function update($id = null, $data = null): bool
    {
        if ($id !== null) {
            $this->validationRules['code'] = "required|alpha_numeric|max_length[20]|is_unique[matieres.code,id,{$id}]";
        }

        return parent::update($id, $data);
    }

    /**
     * Récupère une matière avec son niveau
     */
    public function getWithNiveau($id)
    {
        return $this->select('matieres.*, niveaux.nom as niveau_nom')
            ->join('niveaux', 'niveaux.id = matieres.niveau_id', 'left')
            ->where('matieres.id', $id)
            ->first();
    }

    /**
     * Vérifie si le code existe (pour la validation unique)
     */
    public function isCodeUnique($code, $exceptId = null)
    {
        $builder = $this->where('code', $code);

        if ($exceptId) {
            $builder->where('id !=', $exceptId);
        }

        return $builder->countAllResults() === 0;
    }

    /**
     * Récupère les matières par niveau
     */
    public function getByNiveau($niveauId)
    {
        return $this->where('niveau_id', $niveauId)
            ->orderBy('nom', 'ASC')
            ->findAll();
    }

    /**
     * Compte le nombre de matières par niveau
     */
    public function countByNiveau($niveauId)
    {
        return $this->where('niveau_id', $niveauId)
            ->countAllResults();
    }

    public function getMatieresParNiveau($niveauId)
    {
        return $this->where('niveau_id', $niveauId)
            ->orderBy('nom', 'ASC')
            ->findAll();
    }

    public function getMatieresAvecNiveau()
    {
        $builder = $this->db->table('matieres m');
        $builder->select('m.*, n.nom as niveau_nom');
        $builder->join('niveaux n', 'n.id = m.niveau_id');
        $builder->orderBy('n.ordre, m.nom');

        return $builder->get()->getResultArray();
    }
}
