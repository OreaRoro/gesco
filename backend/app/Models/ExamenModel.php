<?php

namespace App\Models;

use CodeIgniter\Model;

class ExamenModel extends Model
{
    protected $table            = 'examens';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['nom', 'type', 'date_debut', 'date_fin', 'annee_scolaire_id', 'periode_id', 'statut'];

    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Validation
    protected $validationRules = [
        'nom' => 'required|max_length[100]',
        'type' => 'required|in_list[trimestriel,semestriel,annuel,composition]',
        'date_debut' => 'required|valid_date',
        'date_fin' => 'required|valid_date',
        'annee_scolaire_id' => 'required|integer',
        'periode_id' => 'permit_empty|integer'
    ];

    public function getExamensAvecDetails($page = 1, $perPage = 10, $search = '', $type = '', $anneeScolaireId = null)
    {
        $builder = $this->db->table('examens e');
        $builder->select('e.*, a.annee, p.nom as periode_nom, p.type as periode_type');
        $builder->join('annees_scolaires a', 'a.id = e.annee_scolaire_id');
        $builder->join('periodes p', 'p.id = e.periode_id', 'left');

        if ($anneeScolaireId) {
            $builder->where('e.annee_scolaire_id', $anneeScolaireId);
        }

        if ($type) {
            $builder->where('e.type', $type);
        }

        if ($search) {
            $builder->like('e.nom', $search);
        }

        $builder->orderBy('e.date_debut', 'DESC');

        // Pour la pagination, on utilise la méthode du modèle
        $offset = ($page - 1) * $perPage;
        $builder->limit($perPage, $offset);

        return $builder->get()->getResultArray();
    }

    public function getTotalExamens($search = '', $type = '', $anneeScolaireId = null)
    {
        $builder = $this->db->table('examens e');

        if ($anneeScolaireId) {
            $builder->where('e.annee_scolaire_id', $anneeScolaireId);
        }

        if ($type) {
            $builder->where('e.type', $type);
        }

        if ($search) {
            $builder->like('e.nom', $search);
        }

        return $builder->countAllResults();
    }

    public function getExamenComplet($id)
    {
        $builder = $this->db->table('examens e');
        $builder->select('e.*, a.annee, p.nom as periode_nom, p.type as periode_type');
        $builder->join('annees_scolaires a', 'a.id = e.annee_scolaire_id');
        $builder->join('periodes p', 'p.id = e.periode_id', 'left');
        $builder->where('e.id', $id);

        return $builder->get()->getRowArray();
    }

    public function getExamensParAnnee($anneeScolaireId)
    {
        return $this->where('annee_scolaire_id', $anneeScolaireId)
            ->orderBy('date_debut', 'DESC')
            ->findAll();
    }

    public function getExamensAvecPagination($page = 1, $perPage = 10, $filters = [])
    {
        $builder = $this->db->table('examens e');
        $builder->select('e.*, a.annee, p.nom as periode_nom, p.type as periode_type');
        $builder->join('annees_scolaires a', 'a.id = e.annee_scolaire_id');
        $builder->join('periodes p', 'p.id = e.periode_id', 'left');

        if (!empty($filters['annee_scolaire_id'])) {
            $builder->where('e.annee_scolaire_id', $filters['annee_scolaire_id']);
        }

        if (!empty($filters['type'])) {
            $builder->where('e.type', $filters['type']);
        }

        if (!empty($filters['search'])) {
            $builder->like('e.nom', $filters['search']);
        }

        $builder->orderBy('e.date_debut', 'DESC');

        // Calcul de l'offset
        $offset = ($page - 1) * $perPage;
        $builder->limit($perPage, $offset);

        return [
            'examens' => $builder->get()->getResultArray(),
            'total' => $this->getTotalExamens(
                $filters['search'] ?? '',
                $filters['type'] ?? '',
                $filters['annee_scolaire_id'] ?? null
            )
        ];
    }
}
