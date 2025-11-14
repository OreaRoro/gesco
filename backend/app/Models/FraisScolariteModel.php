<?php

namespace App\Models;

use CodeIgniter\Model;

class FraisScolariteModel extends Model
{
    protected $table            = 'frais_scolarite';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['niveau_id', 'annee_scolaire_id', 'montant', 'frais_inscription', 'frais_dossier'];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = null;

    // Validation
    protected $validationRules      = [
        'niveau_id' => 'required|integer',
        'annee_scolaire_id' => 'required|integer',
        'montant' => 'required|decimal',
        'frais_inscription' => 'required|decimal',
        'frais_dossier' => 'required|decimal'
    ];

    protected $validationMessages   = [
        'niveau_id' => [
            'required' => 'Le niveau est obligatoire'
        ],
        'annee_scolaire_id' => [
            'required' => 'L\'année scolaire est obligatoire'
        ],
        'montant' => [
            'required' => 'Le montant est obligatoire'
        ]
    ];

    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    /**
     * Récupère tous les frais avec détails
     */
    public function getAllFrais($filters = [])
    {
        $builder = $this->db->table('frais_scolarite fs');
        $builder->select('fs.*, n.nom as niveau_nom, n.cycle, a.annee as annee_scolaire_annee')
            ->join('niveaux n', 'n.id = fs.niveau_id', 'left')
            ->join('annees_scolaires a', 'a.id = fs.annee_scolaire_id', 'left');

        // Appliquer les filtres
        if (!empty($filters['niveau_id'])) {
            $builder->where('fs.niveau_id', $filters['niveau_id']);
        }

        if (!empty($filters['annee_scolaire_id'])) {
            $builder->where('fs.annee_scolaire_id', $filters['annee_scolaire_id']);
        }

        $builder->orderBy('a.annee', 'DESC')
            ->orderBy('n.ordre', 'ASC');

        return $builder->get()->getResultArray();
    }

    /**
     * Récupère les frais avec détails
     */
    public function getWithDetails($id)
    {
        $builder = $this->db->table('frais_scolarite fs');
        $builder->select('fs.*, n.nom as niveau_nom, n.cycle, a.annee as annee_scolaire_annee')
            ->join('niveaux n', 'n.id = fs.niveau_id', 'left')
            ->join('annees_scolaires a', 'a.id = fs.annee_scolaire_id', 'left')
            ->where('fs.id', $id);

        return $builder->get()->getRowArray();
    }

    /**
     * Récupère les frais par niveau
     */
    public function getByNiveau($niveauId, $anneeScolaireId = null)
    {
        $builder = $this->db->table('frais_scolarite fs');
        $builder->select('fs.*, n.nom as niveau_nom, n.cycle, a.annee as annee_scolaire_annee')
            ->join('niveaux n', 'n.id = fs.niveau_id', 'left')
            ->join('annees_scolaires a', 'a.id = fs.annee_scolaire_id', 'left')
            ->where('fs.niveau_id', $niveauId);

        if ($anneeScolaireId) {
            $builder->where('fs.annee_scolaire_id', $anneeScolaireId);
        } else {
            // Prendre l'année scolaire active par défaut
            $builder->join('annees_scolaires a_active', 'a_active.id = fs.annee_scolaire_id AND a_active.statut = "courante"', 'left');
        }

        return $builder->get()->getRowArray();
    }

    /**
     * Récupère les frais par classe
     */
    public function getByClasse($classeId)
    {
        $builder = $this->db->table('frais_scolarite fs');
        $builder->select('fs.*')
            ->join('classes c', 'c.niveau_id = fs.niveau_id')
            ->join('annees_scolaires a', 'a.id = fs.annee_scolaire_id AND a.statut = "courante"')
            ->where('c.id', $classeId);

        return $builder->get()->getRowArray();
    }

    /**
     * Vérifie si des frais existent pour un niveau et une année scolaire
     */
    public function fraisExist($niveauId, $anneeScolaireId)
    {
        return $this->where('niveau_id', $niveauId)
            ->where('annee_scolaire_id', $anneeScolaireId)
            ->countAllResults() > 0;
    }
}
