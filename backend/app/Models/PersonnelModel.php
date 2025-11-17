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
        'photo',
        'specialite',
        'niveau_etude'
    ];

    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'nom' => 'required|max_length[100]',
        'prenom' => 'required|max_length[100]',
        'type_personnel' => 'required|in_list[enseignant,surveillant,administratif,menage,direction,autre]',
        'date_embauche' => 'required|valid_date',
        'salaire_base' => 'required|decimal',
        'statut' => 'required|in_list[actif,inactif,congé,licencie]'
    ];

    protected $validationMessages = [];
    protected $skipValidation     = false;

    public function getFiltered(array $filters = [])
    {
        $builder = $this->builder();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $builder->groupStart()
                ->like('nom', $search)
                ->orLike('prenom', $search)
                ->orLike('matricule', $search)
                ->orLike('email', $search)
                ->groupEnd();
        }

        if (!empty($filters['type_personnel'])) {
            $builder->where('type_personnel', $filters['type_personnel']);
        }

        if (!empty($filters['statut'])) {
            $builder->where('statut', $filters['statut']);
        }

        $builder->orderBy('nom', 'ASC');
        $builder->orderBy('prenom', 'ASC');

        return $builder->get()->getResultArray();
    }



    /**
     * Récupère le personnel administratif
     */
    public function getAdministratif($statut = 'actif')
    {
        return $this->getByType('direction', $statut);
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
}
