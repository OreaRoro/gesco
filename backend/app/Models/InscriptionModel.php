<?php

namespace App\Models;

use CodeIgniter\Model;

class InscriptionModel extends Model
{
    protected $table = 'inscriptions';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'eleve_id',
        'classe_id',
        'annee_scolaire_id',
        'date_inscription',
        'montant_inscription',
        'montant_paye',
        'statut'
    ];

    protected $useTimestamps = false;
    protected $createdField = 'created_at';

    protected $validationRules = [
        'eleve_id' => 'required|integer',
        'classe_id' => 'required|integer',
        'annee_scolaire_id' => 'required|integer',
        'date_inscription' => 'required|valid_date',
        'statut' => 'required|in_list[inscrit,reinscrit,transfere,abandon]'
    ];

    /**
     * Inscrire un élève dans une classe
     */
    public function inscrireEleve($data)
    {
        // Vérifier si l'élève n'est pas déjà inscrit pour cette année
        $existing = $this->where('eleve_id', $data['eleve_id'])
            ->where('annee_scolaire_id', $data['annee_scolaire_id'])
            ->first();

        if ($existing) {
            throw new \Exception('Cet élève est déjà inscrit pour cette année scolaire.');
        }

        return $this->insert($data);
    }

    public function getInscriptionsByEleve($eleveId, $anneeScolaireId = null)
    {
        $builder = $this->select('inscriptions.*, 
                           classes.id as classe_id,
                           classes.nom as classe_nom,
                           niveaux.id as niveau_id,
                           niveaux.nom as niveau_nom,
                           niveaux.cycle as niveau_cycle,
                           annees_scolaires.id as annee_scolaire_id,
                           annees_scolaires.annee as annee_scolaire_nom,
                           annees_scolaires.statut as annee_scolaire_statut,
                           annees_scolaires.date_debut,
                           annees_scolaires.date_fin')
            ->join('classes', 'classes.id = inscriptions.classe_id')
            ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left')
            ->join('annees_scolaires', 'annees_scolaires.id = inscriptions.annee_scolaire_id')
            ->where('eleve_id', $eleveId);

        // Ajouter le filtre par année scolaire si spécifié
        if ($anneeScolaireId) {
            $builder->where('inscriptions.annee_scolaire_id', $anneeScolaireId);
        }

        $inscriptions = $builder->orderBy('annees_scolaires.annee', 'DESC')
            ->orderBy('inscriptions.created_at', 'DESC')
            ->findAll();

        // Transformer le format pour correspondre au type TS
        return array_map(function ($inscription) {
            return [
                'id' => (int)$inscription['id'],
                'eleve_id' => (int)$inscription['eleve_id'],
                'classe_id' => (int)$inscription['classe_id'],
                'annee_scolaire_id' => (int)$inscription['annee_scolaire_id'],
                'date_inscription' => $inscription['date_inscription'],
                'date_fin' => $inscription['date_fin'] ?? null,
                'montant_inscription' => $inscription['montant_inscription'] ?? 0,
                'montant_paye' => $inscription['montant_paye'] ?? 0,
                'statut' => $inscription['statut'],
                'created_at' => $inscription['created_at'] ?? null,
                'updated_at' => $inscription['updated_at'] ?? null,
                'classe' => [
                    'id' => (int)$inscription['classe_id'],
                    'nom' => $inscription['classe_nom'],
                    'niveau' => [
                        'id' => (int)$inscription['niveau_id'],
                        'nom' => $inscription['niveau_nom'],
                        'cycle' => $inscription['niveau_cycle'],
                    ],
                ],
                'annee_scolaire' => [
                    'id' => (int)$inscription['annee_scolaire_id'],
                    'annee' => $inscription['annee_scolaire_nom'],
                    'statut' => $inscription['annee_scolaire_statut'],
                    'date_debut' => $inscription['date_debut'],
                    'date_fin' => $inscription['date_fin'],
                ],
            ];
        }, $inscriptions);
    }

    /**
     * Récupère toutes les inscriptions avec données imbriquées
     */
    public function getAllWithRelations($anneeScolaireId = null, $filters = [], $perPage = 10, $page = 1)
    {
        try {
            $builder = $this
                ->select('inscriptions.*, 
                     eleves.nom as eleve_nom,
                     eleves.prenom as eleve_prenom,
                     eleves.matricule as eleve_matricule,
                     eleves.date_naissance as eleve_date_naissance,
                     eleves.sexe as eleve_sexe,
                     eleves.photo as photo,
                     classes.nom as classe_nom,
                     classes.capacite_max as classe_capacite,
                     niveaux.id as niveau_id,
                     niveaux.nom as niveau_nom,
                     niveaux.cycle as niveau_cycle,
                     annees_scolaires.id as annee_scolaire_id,
                     annees_scolaires.annee as annee_scolaire_nom,
                     annees_scolaires.date_debut as annee_date_debut,
                     annees_scolaires.date_fin as annee_date_fin,
                     annees_scolaires.statut as annee_statut')
                ->join('eleves', 'eleves.id = inscriptions.eleve_id')
                ->join('classes', 'classes.id = inscriptions.classe_id')
                ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left')
                ->join('annees_scolaires', 'annees_scolaires.id = inscriptions.annee_scolaire_id');

            // Filtre par année scolaire
            if ($anneeScolaireId) {
                $builder->where('inscriptions.annee_scolaire_id', $anneeScolaireId);
            }

            // Filtre par statut
            if (!empty($filters['statut'])) {
                $builder->where('inscriptions.statut', $filters['statut']);
            }

            // Filtre par recherche
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $builder->groupStart()
                    ->like('eleves.nom', $search)
                    ->orLike('eleves.prenom', $search)
                    ->orLike('eleves.matricule', $search)
                    ->orLike('classes.nom', $search)
                    ->orLike('niveaux.nom', $search)
                    ->orLike('annees_scolaires.annee', $search)
                    ->groupEnd();
            }

            // Compter le total avant pagination
            $total = $builder->countAllResults(false);

            // Appliquer la pagination
            $offset = ($page - 1) * $perPage;
            $results = $builder->orderBy('annees_scolaires.annee', 'DESC')
                ->orderBy('eleves.nom', 'ASC')
                ->orderBy('eleves.prenom', 'ASC')
                ->limit($perPage, $offset)
                ->get()
                ->getResultArray();

            // Transformer en structure imbriquée
            $inscriptions = $this->formatInscriptionsWithRelations($results);

            return [
                'inscriptions' => $inscriptions,
                'pagination' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$perPage,
                    'total' => $total,
                    'total_pages' => $total > 0 ? ceil($total / $perPage) : 0,
                    'from' => $total > 0 ? $offset + 1 : 0,
                    'to' => $total > 0 ? min($offset + $perPage, $total) : 0,
                ]
            ];
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionModel::getAllWithRelations: ' . $e->getMessage());
            throw new \Exception('Erreur lors de la récupération des inscriptions: ' . $e->getMessage());
        }
    }

    /**
     * Formate les inscriptions avec une structure imbriquée
     */
    private function formatInscriptionsWithRelations($inscriptions)
    {
        return array_map(function ($inscription) {
            return [
                'id' => (int)$inscription['id'],
                'eleve_id' => (int)$inscription['eleve_id'],
                'classe_id' => (int)$inscription['classe_id'],
                'annee_scolaire_id' => (int)$inscription['annee_scolaire_id'],
                'date_inscription' => $inscription['date_inscription'],
                'montant_inscription' => (float)$inscription['montant_inscription'],
                'montant_paye' => (float)$inscription['montant_paye'],
                'statut' => $inscription['statut'],
                'created_at' => $inscription['created_at'],

                // Relations imbriquées
                'eleve' => [
                    'id' => (int)$inscription['eleve_id'],
                    'nom' => $inscription['eleve_nom'],
                    'prenom' => $inscription['eleve_prenom'],
                    'matricule' => $inscription['eleve_matricule'],
                    'date_naissance' => $inscription['eleve_date_naissance'],
                    'sexe' => $inscription['eleve_sexe'],
                    'photo' => $inscription['photo']
                ],

                'classe' => [
                    'id' => (int)$inscription['classe_id'],
                    'nom' => $inscription['classe_nom'],
                    'capacite_max' => (int)$inscription['classe_capacite'],
                    'niveau' => [
                        'id' => (int)$inscription['niveau_id'],
                        'nom' => $inscription['niveau_nom'],
                        'cycle' => $inscription['niveau_cycle']
                    ]
                ],

                'annee_scolaire' => [
                    'id' => (int)$inscription['annee_scolaire_id'],
                    'annee' => $inscription['annee_scolaire_nom'],
                    'date_debut' => $inscription['annee_date_debut'],
                    'date_fin' => $inscription['annee_date_fin'],
                    'statut' => $inscription['annee_statut']
                ]
            ];
        }, $inscriptions);
    }

    /**
     * Récupère les inscriptions d'un élève avec données imbriquées
     */
    public function getByEleveWithRelations($eleveId, $anneeScolaireId = null)
    {
        $builder = $this
            ->select('inscriptions.*, 
                 eleves.nom as eleve_nom,
                 eleves.prenom as eleve_prenom,
                 eleves.matricule as eleve_matricule,
                 eleves.photo as photo,
                 classes.nom as classe_nom,
                 niveaux.nom as niveau_nom,
                 niveaux.cycle as niveau_cycle,
                 annees_scolaires.annee as annee_scolaire_nom,
                 annees_scolaires.date_debut as annee_date_debut,
                 annees_scolaires.date_fin as annee_date_fin,
                 annees_scolaires.statut as annee_statut')
            ->join('eleves', 'eleves.id = inscriptions.eleve_id')
            ->join('classes', 'classes.id = inscriptions.classe_id')
            ->join('niveaux', 'niveaux.id = classes.niveau_id', 'left')
            ->join('annees_scolaires', 'annees_scolaires.id = inscriptions.annee_scolaire_id')
            ->where('inscriptions.eleve_id', $eleveId);

        if ($anneeScolaireId) {
            $builder->where('inscriptions.annee_scolaire_id', $anneeScolaireId);
        }

        $results = $builder->orderBy('annees_scolaires.annee', 'DESC')
            ->orderBy('inscriptions.created_at', 'DESC')
            ->findAll();

        return $this->formatInscriptionsWithRelations($results);
    }
}
