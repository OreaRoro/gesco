<?php

namespace App\Models;

use CodeIgniter\Model;

class PersonnelModel extends Model
{
    protected $table            = 'personnel';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'matricule',
        'nom',
        'prenom',
        'sexe',
        'date_naissance',
        'lieu_naissance',
        'adresse',
        'telephone',
        'email',
        'type_personnel',
        'date_embauche',
        'salaire_base',
        'statut',
        'photo'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Validation
    protected $validationRules      = [
        'matricule'      => 'required|max_length[50]|is_unique[personnel.matricule,id,{id}]',
        'nom'           => 'required|max_length[100]',
        'prenom'        => 'required|max_length[100]',
        'sexe'          => 'permit_empty|in_list[M,F]',
        'date_naissance' => 'permit_empty|valid_date',
        'type_personnel' => 'required|in_list[enseignant,surveillant,administratif,menage,direction,autre]',
        'date_embauche'  => 'required|valid_date',
        'salaire_base'   => 'permit_empty|decimal',
        'statut'         => 'required|in_list[actif,inactif,congé,licencie]',
        'email'          => 'permit_empty|valid_email|max_length[100]',
        'telephone'      => 'permit_empty|max_length[20]'
    ];

    protected $validationMessages   = [
        'matricule' => [
            'required' => 'Le matricule est obligatoire',
            'is_unique' => 'Ce matricule existe déjà'
        ],
        'nom' => [
            'required' => 'Le nom est obligatoire'
        ],
        'prenom' => [
            'required' => 'Le prénom est obligatoire'
        ],
        'type_personnel' => [
            'required' => 'Le type de personnel est obligatoire'
        ],
        'date_embauche' => [
            'required' => 'La date d\'embauche est obligatoire',
            'valid_date' => 'La date d\'embauche n\'est pas valide'
        ]
    ];

    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $beforeInsert = ['generateMatricule'];
    protected $beforeUpdate = ['beforeUpdate'];

    /**
     * Génère un matricule automatique si non fourni
     */
    protected function generateMatricule(array $data)
    {
        if (!isset($data['data']['matricule']) || empty($data['data']['matricule'])) {
            $prefix = $this->getMatriculePrefix($data['data']['type_personnel']);
            $year = date('Y');
            $lastNumber = $this->getLastMatriculeNumber($prefix, $year);

            $data['data']['matricule'] = $prefix . $year . sprintf('%03d', $lastNumber + 1);
        }

        return $data;
    }

    /**
     * Préfixe du matricule selon le type de personnel
     */
    protected function getMatriculePrefix($typePersonnel)
    {
        $prefixes = [
            'enseignant' => 'ENS',
            'surveillant' => 'SUR',
            'administratif' => 'ADM',
            'menage' => 'MEN',
            'direction' => 'DIR',
            'autre' => 'AUT'
        ];

        return $prefixes[$typePersonnel] ?? 'PER';
    }

    /**
     * Récupère le dernier numéro de matricule pour un préfixe et une année
     */
    protected function getLastMatriculeNumber($prefix, $year)
    {
        $builder = $this->db->table($this->table);
        $builder->select('matricule')
            ->like('matricule', $prefix . $year, 'after')
            ->orderBy('id', 'DESC')
            ->limit(1);

        $result = $builder->get()->getRow();

        if ($result && preg_match('/' . $prefix . $year . '(\d+)/', $result->matricule, $matches)) {
            return (int) $matches[1];
        }

        return 0;
    }

    protected function beforeUpdate(array $data)
    {
        // Logique avant mise à jour si nécessaire
        return $data;
    }

    /**
     * Récupère tout le personnel avec filtres optionnels
     */
    public function getAllPersonnel($filters = [])
    {
        $builder = $this->db->table('personnel p');
        $builder->select('p.*');

        // Appliquer les filtres
        if (!empty($filters['type_personnel'])) {
            if (strpos($filters['type_personnel'], ',') !== false) {
                $types = explode(',', $filters['type_personnel']);
                $builder->whereIn('p.type_personnel', $types);
            } else {
                $builder->where('p.type_personnel', $filters['type_personnel']);
            }
        }

        if (!empty($filters['statut'])) {
            $builder->where('p.statut', $filters['statut']);
        }

        if (!empty($filters['search'])) {
            $builder->groupStart()
                ->like('p.nom', $filters['search'])
                ->orLike('p.prenom', $filters['search'])
                ->orLike('p.matricule', $filters['search'])
                ->orLike('p.email', $filters['search'])
                ->groupEnd();
        }

        $builder->orderBy('p.nom', 'ASC')
            ->orderBy('p.prenom', 'ASC');

        return $builder->get()->getResultArray();
    }

    /**
     * Récupère le personnel par type
     */
    public function getByType($typePersonnel, $statut = 'actif')
    {
        $builder = $this->db->table('personnel p');
        $builder->select('p.*')
            ->where('p.type_personnel', $typePersonnel);

        if ($statut) {
            $builder->where('p.statut', $statut);
        }

        $builder->orderBy('p.nom', 'ASC')
            ->orderBy('p.prenom', 'ASC');

        return $builder->get()->getResultArray();
    }

    /**
     * Récupère les enseignants actifs
     */
    public function getEnseignants($statut = 'actif')
    {
        return $this->getByType('enseignant', $statut);
    }

    /**
     * Récupère les surveillants actifs
     */
    public function getSurveillants($statut = 'actif')
    {
        return $this->getByType('surveillant', $statut);
    }

    /**
     * Récupère le personnel administratif
     */
    public function getAdministratif($statut = 'actif')
    {
        return $this->getByType('direction', $statut);
    }

    /**
     * Vérifie si un personnel est utilisé dans d'autres tables
     */
    public function isUsed($personnelId)
    {
        // Vérifier dans les classes (professeur principal)
        $builderClasses = $this->db->table('classes');
        $usedInClasses = $builderClasses->where('professeur_principal_id', $personnelId)
            ->orWhere('surveillant_id', $personnelId)
            ->countAllResults() > 0;

        if ($usedInClasses) {
            return true;
        }

        // Vérifier dans les emplois du temps
        $builderEmploi = $this->db->table('emplois_du_temps');
        $usedInEmploi = $builderEmploi->where('enseignant_id', $personnelId)
            ->countAllResults() > 0;

        if ($usedInEmploi) {
            return true;
        }

        // Vérifier dans les pointages
        $builderPointage = $this->db->table('pointages_personnel');
        $usedInPointage = $builderPointage->where('personnel_id', $personnelId)
            ->countAllResults() > 0;

        return $usedInPointage;
    }

    /**
     * Récupère les statistiques du personnel
     */
    public function getStats()
    {
        $builder = $this->db->table('personnel p');
        $builder->select('type_personnel, statut, COUNT(*) as count')
            ->groupBy('type_personnel, statut');

        $results = $builder->get()->getResultArray();

        $stats = [
            'total' => 0,
            'par_type' => [],
            'par_statut' => []
        ];

        foreach ($results as $row) {
            $stats['total'] += $row['count'];

            // Stats par type
            if (!isset($stats['par_type'][$row['type_personnel']])) {
                $stats['par_type'][$row['type_personnel']] = 0;
            }
            $stats['par_type'][$row['type_personnel']] += $row['count'];

            // Stats par statut
            if (!isset($stats['par_statut'][$row['statut']])) {
                $stats['par_statut'][$row['statut']] = 0;
            }
            $stats['par_statut'][$row['statut']] += $row['count'];
        }

        return $stats;
    }

    /**
     * Met à jour le statut d'un membre du personnel
     */
    public function updateStatut($personnelId, $statut)
    {
        return $this->update($personnelId, ['statut' => $statut]);
    }

    /**
     * Recherche du personnel
     */
    public function search($term)
    {
        $builder = $this->db->table('personnel p');
        $builder->select('p.*')
            ->groupStart()
            ->like('p.nom', $term)
            ->orLike('p.prenom', $term)
            ->orLike('p.matricule', $term)
            ->orLike('p.email', $term)
            ->orLike('p.telephone', $term)
            ->groupEnd()
            ->where('p.statut', 'actif')
            ->orderBy('p.nom', 'ASC')
            ->orderBy('p.prenom', 'ASC');

        return $builder->get()->getResultArray();
    }
}
