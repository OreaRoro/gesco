<?php

namespace App\Models;

use CodeIgniter\Model;

class EnseignantMatiereModel extends Model
{
    protected $table            = 'enseignant_matieres';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'enseignant_id',
        'matiere_id',
        'classe_id',
        'annee_scolaire_id',
        'heures_semaine'
    ];

    protected $useTimestamps = false;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    public function getByEnseignant($enseignantId)
    {
        $builder = $this->builder();
        $builder->select('enseignant_matieres.*, 
                         matieres.nom as matiere_nom,
                         matieres.code as matiere_code,
                         classes.nom as classe_nom,
                         annees_scolaires.annee as annee_scolaire')
            ->join('matieres', 'matieres.id = enseignant_matieres.matiere_id')
            ->join('classes', 'classes.id = enseignant_matieres.classe_id')
            ->join('annees_scolaires', 'annees_scolaires.id = enseignant_matieres.annee_scolaire_id')
            ->where('enseignant_matieres.enseignant_id', $enseignantId)
            ->orderBy('annees_scolaires.annee', 'DESC')
            ->orderBy('matieres.nom', 'ASC');

        return $builder->get()->getResultArray();
    }

    public function getEmploiDuTemps($enseignantId, $anneeScolaireId = null)
    {
        $builder = $this->builder();
        $builder->select('enseignant_matieres.*,
                         matieres.nom as matiere_nom,
                         classes.nom as classe_nom,
                         emplois_du_temps.jour_semaine,
                         emplois_du_temps.heure_debut,
                         emplois_du_temps.heure_fin,
                         emplois_du_temps.salle')
            ->join('matieres', 'matieres.id = enseignant_matieres.matiere_id')
            ->join('classes', 'classes.id = enseignant_matieres.classe_id')
            ->join(
                'emplois_du_temps',
                'emplois_du_temps.matiere_id = enseignant_matieres.matiere_id AND 
                     emplois_du_temps.classe_id = enseignant_matieres.classe_id AND
                     emplois_du_temps.annee_scolaire_id = enseignant_matieres.annee_scolaire_id',
                'left'
            )
            ->where('enseignant_matieres.enseignant_id', $enseignantId);

        if ($anneeScolaireId) {
            $builder->where('enseignant_matieres.annee_scolaire_id', $anneeScolaireId);
        }

        $builder->orderBy('emplois_du_temps.jour_semaine', 'ASC')
            ->orderBy('emplois_du_temps.heure_debut', 'ASC');

        return $builder->get()->getResultArray();
    }

    public function getStats($enseignantId)
    {
        $builder = $this->builder();

        // Statistiques générales
        $stats = $builder->select("
            COUNT(*) as total_matieres,
            SUM(heures_semaine) as total_heures_semaine,
            COUNT(DISTINCT classe_id) as total_classes,
            COUNT(DISTINCT annee_scolaire_id) as total_annees
        ")->where('enseignant_id', $enseignantId)->get()->getRowArray();

        // Matières les plus enseignées
        $matieresFrequentes = $builder->select("
            matieres.nom as matiere_nom,
            COUNT(*) as nb_assignations,
            SUM(heures_semaine) as total_heures
        ")
            ->join('matieres', 'matieres.id = enseignant_matieres.matiere_id')
            ->where('enseignant_id', $enseignantId)
            ->groupBy('matiere_id')
            ->orderBy('nb_assignations', 'DESC')
            ->limit(5)
            ->get()
            ->getResultArray();

        $stats['matieres_frequentes'] = $matieresFrequentes;

        return $stats;
    }
}
