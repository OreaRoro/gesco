<?php

namespace App\Models;

use CodeIgniter\Model;

class PeriodeModel extends Model
{
    protected $table            = 'periodes';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = ['annee_scolaire_id', 'nom', 'type', 'date_debut', 'date_fin', 'ordre'];

    public function getPeriodesParAnnee($anneeScolaireId)
    {
        return $this->where('annee_scolaire_id', $anneeScolaireId)
            ->orderBy('ordre', 'ASC')
            ->findAll();
    }
}
