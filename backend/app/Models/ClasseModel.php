<?php

namespace App\Models;

use CodeIgniter\Model;

class ClasseModel extends Model
{
    protected $table            = 'classes';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['nom', 'niveau_id', 'capacite_max', 'professeur_principal_id', 'surveillant_id', 'annee_scolaire_id'];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = null;

    // Validation
    protected $validationRules      = [
        'nom' => 'required|max_length[50]',
        'niveau_id' => 'required|integer',
        'capacite_max' => 'required|integer|greater_than[0]',
        'professeur_principal_id' => 'permit_empty|integer',
        'surveillant_id' => 'permit_empty|integer',
        'annee_scolaire_id' => 'permit_empty|integer'
    ];
    protected $validationMessages   = [
        'nom' => [
            'required' => 'Le nom de la classe est obligatoire'
        ],
        'niveau_id' => [
            'required' => 'Le niveau est obligatoire'
        ],
        'capacite_max' => [
            'required' => 'La capacité maximale est obligatoire',
            'greater_than' => 'La capacité doit être supérieure à 0'
        ]
    ];
    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    /**
     * Récupère les classes avec leurs détails
     */
    public function getClassesWithDetails($anneeScolaireId = null, $niveauId = null)
    {
        $builder = $this->db->table('classes c');
        $builder->select('c.*, n.nom as niveau_nom, n.cycle, 
                 pp.nom as pp_nom, pp.prenom as pp_prenom,
                 s.nom as surveillant_nom, s.prenom as surveillant_prenom,
                 a.annee as annee_scolaire_annee,
                 (SELECT COUNT(*) FROM inscriptions i WHERE i.classe_id = c.id AND i.statut IN ("inscrit", "reinscrit")) as effectif');

        $builder->join('niveaux n', 'n.id = c.niveau_id', 'left');
        $builder->join('personnel pp', 'pp.id = c.professeur_principal_id', 'left');
        $builder->join('personnel s', 's.id = c.surveillant_id', 'left');
        $builder->join('annees_scolaires a', 'a.id = c.annee_scolaire_id', 'left');

        if ($anneeScolaireId) {
            $builder->where('c.annee_scolaire_id', $anneeScolaireId);
        }

        if ($niveauId) {
            $builder->where('c.niveau_id', $niveauId);
        }

        $builder->orderBy('n.ordre', 'ASC');
        $builder->orderBy('c.nom', 'ASC');

        return $builder->get()->getResultArray();
    }

    /**
     * Récupère une classe avec ses détails
     */
    public function getClasseWithDetails($id)
    {
        $builder = $this->db->table('classes c');
        $builder->select('c.*, n.nom as niveau_nom, n.cycle, n.id as niveau_id,
                         pp.nom as pp_nom, pp.prenom as pp_prenom, pp.id as pp_id,
                         s.nom as surveillant_nom, s.prenom as surveillant_prenom, s.id as surveillant_id,
                         a.annee as annee_scolaire_annee, a.id as annee_scolaire_id');

        $builder->join('niveaux n', 'n.id = c.niveau_id', 'left');
        $builder->join('personnel pp', 'pp.id = c.professeur_principal_id', 'left');
        $builder->join('personnel s', 's.id = c.surveillant_id', 'left');
        $builder->join('annees_scolaires a', 'a.id = c.annee_scolaire_id', 'left');

        $builder->where('c.id', $id);

        return $builder->get()->getRowArray();
    }

    /**
     * Vérifie si une classe a des inscriptions
     */
    public function hasInscriptions($classeId)
    {
        $builder = $this->db->table('inscriptions');
        return $builder->where('classe_id', $classeId)->countAllResults() > 0;
    }

    /**
     * Récupère l'effectif d'une classe
     */
    public function getEffectif($classeId)
    {
        $builder = $this->db->table('inscriptions');
        return $builder->where('classe_id', $classeId)
            ->whereIn('statut', ['inscrit', 'reinscrit'])
            ->countAllResults();
    }

    /**
     * Récupère les classes par niveau
     */
    public function getByNiveau($niveauId)
    {
        return $this->where('niveau_id', $niveauId)->findAll();
    }

    /**
     * Récupère les classes par année scolaire
     */
    public function getByAnneeScolaire($anneeScolaireId)
    {
        return $this->where('annee_scolaire_id', $anneeScolaireId)->findAll();
    }
}
