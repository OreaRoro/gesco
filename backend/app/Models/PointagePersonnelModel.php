<?php

namespace App\Models;

use CodeIgniter\Model;

class PointagePersonnelModel extends Model
{
    protected $table            = 'pointages_personnel';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'personnel_id',
        'date_pointage',
        'heure_arrivee',
        'heure_depart',
        'statut',
        'heures_travail',
        'remarque',
        'pointe_par'
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'personnel_id' => 'required|integer',
        'date_pointage' => 'required|valid_date',
        'statut' => 'required|in_list[present,absent,retard,congé,maladie]'
    ];

    protected $validationMessages = [
        'heure_arrivee' => [
            'regex_match' => 'Le format de l\'heure d\'arrivée doit être HH:MM (ex: 08:30)'
        ],
        'heure_depart' => [
            'regex_match' => 'Le format de l\'heure de départ doit être HH:MM (ex: 17:00)'
        ],
        'date_pointage' => [
            'valid_date' => 'La date de pointage doit être une date valide'
        ]
    ];
    protected $skipValidation     = false;

    public function getFiltered(array $filters = [])
    {
        $builder = $this->builder();
        $builder->select('pointages_personnel.*, 
                         personnel.nom as personnel_nom, 
                         personnel.prenom as personnel_prenom, 
                         personnel.matricule as personnel_matricule,
                         personnel.type_personnel as personnel_type')
            ->join('personnel', 'personnel.id = pointages_personnel.personnel_id');

        if (!empty($filters['date_debut'])) {
            $builder->where('pointages_personnel.date_pointage >=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $builder->where('pointages_personnel.date_pointage <=', $filters['date_fin']);
        }

        if (!empty($filters['personnel_id'])) {
            $builder->where('pointages_personnel.personnel_id', $filters['personnel_id']);
        }

        if (!empty($filters['statut'])) {
            $builder->where('pointages_personnel.statut', $filters['statut']);
        }

        if (!empty($filters['type_personnel'])) {
            $builder->where('personnel.type_personnel', $filters['type_personnel']);
        }

        $builder->orderBy('pointages_personnel.date_pointage', 'DESC');
        $builder->orderBy('personnel.nom', 'ASC');

        return $builder->get()->getResultArray();
    }

    public function getStatsMensuelles($mois, $personnelId = null)
    {
        $builder = $this->builder();

        $builder->select("
            COUNT(*) as total_pointages,
            SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
            SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
            SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards,
            SUM(CASE WHEN statut = 'congé' THEN 1 ELSE 0 END) as conges,
            SUM(CASE WHEN statut = 'maladie' THEN 1 ELSE 0 END) as maladies,
            AVG(heures_travail) as moyenne_heures
        ")->where("DATE_FORMAT(date_pointage, '%Y-%m') =", $mois);

        if ($personnelId) {
            $builder->where('personnel_id', $personnelId);
        }

        return $builder->get()->getRowArray();
    }

    /**
     * Vérifie si un pointage existe déjà pour un personnel à une date donnée
     */
    public function pointageExists($personnelId, $datePointage)
    {
        return $this->where('personnel_id', $personnelId)
            ->where('date_pointage', $datePointage)
            ->first();
    }

    /**
     * Pointage rapide - arrivée
     */
    public function pointerArrivee($personnelId, $heureArrivee = null)
    {
        $dateAujourdhui = date('Y-m-d');

        // Vérifier si un pointage existe déjà
        $pointageExistant = $this->pointageExists($personnelId, $dateAujourdhui);

        if ($pointageExistant) {
            // Mettre à jour l'heure d'arrivée
            return $this->update($pointageExistant['id'], [
                'heure_arrivee' => $heureArrivee ?: date('H:i:s'),
                'statut' => 'present',
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        } else {
            // Créer un nouveau pointage
            return $this->insert([
                'personnel_id' => $personnelId,
                'date_pointage' => $dateAujourdhui,
                'heure_arrivee' => $heureArrivee ?: date('H:i:s'),
                'statut' => 'present',
                'heures_travail' => 0,
                'pointe_par' => session()->get('user_id'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }
    }

    /**
     * Pointage rapide - départ
     */
    public function pointerDepart($personnelId, $heureDepart = null)
    {
        $dateAujourdhui = date('Y-m-d');

        // Récupérer le pointage du jour
        $pointage = $this->pointageExists($personnelId, $dateAujourdhui);

        if (!$pointage) {
            throw new \Exception('Aucun pointage d\'arrivée trouvé pour aujourd\'hui');
        }

        $heureDepart = $heureDepart ?: date('H:i:s');

        // Calculer les heures travaillées
        $heuresTravail = $this->calculerHeuresTravail($pointage['heure_arrivee'], $heureDepart);

        return $this->update($pointage['id'], [
            'heure_depart' => $heureDepart,
            'heures_travail' => $heuresTravail,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Calculer les heures travaillées
     */
    public function calculerHeuresTravail($heureArrivee, $heureDepart)
    {
        if (!$heureArrivee || !$heureDepart) {
            return 0;
        }

        $timestampArrivee = strtotime($heureArrivee);
        $timestampDepart = strtotime($heureDepart);

        $difference = $timestampDepart - $timestampArrivee;
        $heures = $difference / 3600; // Convertir en heures

        return max(0, round($heures, 2));
    }

    /**
     * Récupérer les statistiques par personnel
     */
    public function getStatsParPersonnel($personnelId, $mois = null)
    {
        $builder = $this->builder();

        $builder->select("
            COUNT(*) as total_jours,
            SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as jours_presents,
            SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as jours_absents,
            SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as jours_retard,
            AVG(heures_travail) as moyenne_heures_jour,
            SUM(heures_travail) as total_heures
        ")->where('personnel_id', $personnelId);

        if ($mois) {
            $builder->where("DATE_FORMAT(date_pointage, '%Y-%m') =", $mois);
        }

        return $builder->get()->getRowArray();
    }

    /**
     * Récupérer l'historique des pointages d'un personnel
     */
    public function getHistoriquePersonnel($personnelId, $limit = 30)
    {
        return $this->where('personnel_id', $personnelId)
            ->orderBy('date_pointage', 'DESC')
            ->limit($limit)
            ->findAll();
    }
    public function getEnseignants()
    {
        return $this->where('type_personnel', 'enseignant')
            ->where('statut', 'actif')
            ->findAll();
    }

    public function getFilteredEnseignant(array $filters = [])
    {
        $builder = $this->builder();
        $builder->select('pointages_personnel.*, 
                     personnel.nom as personnel_nom, 
                     personnel.prenom as personnel_prenom, 
                     personnel.matricule as personnel_matricule,
                     personnel.type_personnel as personnel_type')
            ->join('personnel', 'personnel.id = pointages_personnel.personnel_id');

        // Filtrer par défaut sur les enseignants uniquement
        $builder->where('personnel.type_personnel', 'enseignant');

        if (!empty($filters['date_debut'])) {
            $builder->where('pointages_personnel.date_pointage >=', $filters['date_debut']);
        }

        if (!empty($filters['date_fin'])) {
            $builder->where('pointages_personnel.date_pointage <=', $filters['date_fin']);
        }

        if (!empty($filters['personnel_id'])) {
            $builder->where('pointages_personnel.personnel_id', $filters['personnel_id']);
        }

        if (!empty($filters['statut'])) {
            $builder->where('pointages_personnel.statut', $filters['statut']);
        }

        // Si vous voulez garder la possibilité de filtrer par type_personnel
        if (!empty($filters['type_personnel'])) {
            $builder->where('personnel.type_personnel', $filters['type_personnel']);
        }

        $builder->orderBy('pointages_personnel.date_pointage', 'DESC');
        $builder->orderBy('personnel.nom', 'ASC');

        return $builder->get()->getResultArray();
    }
}
