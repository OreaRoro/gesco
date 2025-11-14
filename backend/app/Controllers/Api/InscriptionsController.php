<?php

namespace App\Controllers\Api;

use App\Models\InscriptionModel;
use App\Models\EleveModel;
use App\Models\ClasseModel;
use App\Models\AnneeScolaireModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class InscriptionsController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $inscriptionModel;
    protected $eleveModel;
    protected $classeModel;
    protected $anneeScolaireModel;

    public function __construct()
    {
        $this->inscriptionModel = new InscriptionModel();
        $this->eleveModel = new EleveModel();
        $this->classeModel = new ClasseModel();
        $this->anneeScolaireModel = new AnneeScolaireModel();
    }

    /**
     * GET /api/inscriptions
     * Récupère toutes les inscriptions avec données imbriquées
     */
    public function index()
    {
        try {
            // Récupérer les paramètres de requête avec des valeurs par défaut
            $anneeScolaireId = $this->request->getGet('annee_scolaire_id');
            $statut = $this->request->getGet('statut');
            $search = $this->request->getGet('search');
            $page = (int)($this->request->getGet('page') ?? 1);
            $perPage = (int)($this->request->getGet('perPage') ?? 10);

            // Valider les paramètres
            if ($page < 1) $page = 1;
            if ($perPage < 1) $perPage = 10;
            if ($perPage > 100) $perPage = 100; // Limite pour éviter les abus

            $filters = [];
            if ($statut) {
                $filters['statut'] = $statut;
            }
            if ($search) {
                $filters['search'] = $search;
            }

            // Utilisation du modèle pour la logique métier avec pagination
            $result = $this->inscriptionModel->getAllWithRelations(
                $anneeScolaireId,
                $filters,
                $perPage,
                $page
            );

            return $this->respond([
                'status' => 'success',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionsController::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des inscriptions: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/{id}/inscriptions
     * Récupère les inscriptions d'un élève avec données imbriquées
     */
    public function getByEleve($eleveId = null)
    {
        try {
            $anneeScolaireId = $this->request->getGet('annee_scolaire_id');

            $inscriptions = $this->inscriptionModel->getByEleveWithRelations($eleveId, $anneeScolaireId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'inscriptions' => $inscriptions
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionsController::getByEleve: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des inscriptions: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/inscriptions
     * Créer une nouvelle inscription
     */
    public function create()
    {
        $rules = [
            'eleve_id' => 'required|integer',
            'classe_id' => 'required|integer',
            'annee_scolaire_id' => 'required|integer',
            'date_inscription' => 'required|valid_date',
            'montant_inscription' => 'required|decimal',
            'statut' => 'required|in_list[inscrit,reinscrit,transfere,abandon]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Vérifier que l'élève existe
        $eleve = $this->eleveModel->find($this->request->getJsonVar('eleve_id'));
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier que la classe existe
        $classe = $this->classeModel->find($this->request->getJsonVar('classe_id'));
        if (!$classe) {
            return $this->failNotFound('Classe non trouvée');
        }

        // Vérifier que l'année scolaire existe
        $anneeScolaire = $this->anneeScolaireModel->find($this->request->getJsonVar('annee_scolaire_id'));
        if (!$anneeScolaire) {
            return $this->failNotFound('Année scolaire non trouvée');
        }

        $data = [
            'eleve_id' => $this->request->getJsonVar('eleve_id'),
            'classe_id' => $this->request->getJsonVar('classe_id'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'date_inscription' => $this->request->getJsonVar('date_inscription'),
            'montant_inscription' => $this->request->getJsonVar('montant_inscription'),
            'montant_paye' => $this->request->getJsonVar('montant_paye') ?? 0,
            'statut' => $this->request->getJsonVar('statut')
        ];

        try {
            $inscriptionId = $this->inscriptionModel->inscrireEleve($data);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Élève inscrit avec succès',
                'data' => [
                    'inscription_id' => $inscriptionId
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage(), 400);
        }
    }



    /**
     * DELETE /api/inscriptions/{id}
     * Supprime une inscription
     */
    public function delete($id = null)
    {
        try {
            // Vérifier si l'inscription existe
            $inscription = $this->inscriptionModel->find($id);
            if (!$inscription) {
                return $this->failNotFound('Inscription non trouvée');
            }

            // Vérifier si l'inscription est liée à d'autres données (notes, paiements, etc.)
            // Pour éviter la suppression d'inscriptions utilisées ailleurs
            if ($this->isInscriptionUsed($id)) {
                return $this->fail('Impossible de supprimer cette inscription car elle est utilisée dans le système', 400);
            }

            // Supprimer l'inscription
            $deleted = $this->inscriptionModel->delete($id);

            if (!$deleted) {
                return $this->fail('Erreur lors de la suppression de l\'inscription');
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Inscription supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionsController::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression de l\'inscription');
        }
    }

    /**
     * Vérifie si une inscription est utilisée dans d'autres tables
     */
    private function isInscriptionUsed($inscriptionId)
    {
        // Vérifier dans la table des notes
        $notesModel = new \App\Models\NoteModel();
        $hasNotes = $notesModel->where('inscription_id', $inscriptionId)->countAllResults() > 0;

        // Vérifier dans la table des paiements
        $paiementsModel = new \App\Models\PaiementFraisModel();
        $hasPaiements = $paiementsModel->where('inscription_id', $inscriptionId)->countAllResults() > 0;

        // Vérifier dans la table des pointages
        $pointagesModel = new \App\Models\PointageEleveModel();
        $hasPointages = $pointagesModel->where('inscription_id', $inscriptionId)->countAllResults() > 0;

        return $hasNotes || $hasPaiements || $hasPointages;
    }

    /**
     * GET /api/inscriptions/{id}
     * Récupère une inscription spécifique
     */
    public function show($id = null)
    {
        try {
            $inscription = $this->inscriptionModel->find($id);

            if (!$inscription) {
                return $this->failNotFound('Inscription non trouvée');
            }

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'inscription' => $inscription
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionsController::show: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération de l\'inscription');
        }
    }

    /**
     * PUT /api/inscriptions/{id}
     * Met à jour une inscription
     */
    public function update($id = null)
    {
        try {
            // Vérifier si l'inscription existe
            $inscription = $this->inscriptionModel->find($id);
            if (!$inscription) {
                return $this->failNotFound('Inscription non trouvée');
            }

            $data = $this->request->getJSON(true);

            $rules = [
                'eleve_id' => 'integer',
                'classe_id' => 'integer',
                'annee_scolaire_id' => 'integer',
                'date_inscription' => 'valid_date',
                'montant_inscription' => 'decimal',
                'montant_paye' => 'decimal',
                'statut' => 'in_list[inscrit,reinscrit,transfere,abandon]'
            ];

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            // Vérifications supplémentaires si des champs clés sont modifiés
            if (isset($data['eleve_id']) && $data['eleve_id'] != $inscription['eleve_id']) {
                $eleve = $this->eleveModel->find($data['eleve_id']);
                if (!$eleve) {
                    return $this->failNotFound('Élève non trouvé');
                }
            }

            if (isset($data['classe_id']) && $data['classe_id'] != $inscription['classe_id']) {
                $classe = $this->classeModel->find($data['classe_id']);
                if (!$classe) {
                    return $this->failNotFound('Classe non trouvée');
                }
            }

            if (isset($data['annee_scolaire_id']) && $data['annee_scolaire_id'] != $inscription['annee_scolaire_id']) {
                $anneeScolaire = $this->anneeScolaireModel->find($data['annee_scolaire_id']);
                if (!$anneeScolaire) {
                    return $this->failNotFound('Année scolaire non trouvée');
                }
            }

            $updated = $this->inscriptionModel->update($id, $data);

            if (!$updated) {
                return $this->fail('Erreur lors de la modification de l\'inscription');
            }

            $updatedInscription = $this->inscriptionModel->find($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Inscription modifiée avec succès',
                'data' => [
                    'inscription' => $updatedInscription
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur InscriptionsController::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification de l\'inscription');
        }
    }

    /**
     * POST /api/inscriptions/reinscrire
     * Réinscrire un élève pour une nouvelle année scolaire
     */
    public function reinscrire()
    {
        $rules = [
            'eleve_id' => 'required|integer',
            'classe_id' => 'required|integer',
            'annee_scolaire_id' => 'required|integer',
            'date_inscription' => 'required|valid_date',
            'montant_inscription' => 'required|decimal',
            'statut' => 'required|in_list[inscrit,reinscrit,transfere,abandon]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Vérifier que l'élève existe
        $eleve = $this->eleveModel->find($this->request->getJsonVar('eleve_id'));
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier que la classe existe
        $classe = $this->classeModel->find($this->request->getJsonVar('classe_id'));
        if (!$classe) {
            return $this->failNotFound('Classe non trouvée');
        }

        // Vérifier que l'année scolaire existe
        $anneeScolaire = $this->anneeScolaireModel->find($this->request->getJsonVar('annee_scolaire_id'));
        if (!$anneeScolaire) {
            return $this->failNotFound('Année scolaire non trouvée');
        }

        // Vérifier si l'élève n'est pas déjà inscrit pour cette année
        $existingInscription = $this->inscriptionModel
            ->where('eleve_id', $this->request->getJsonVar('eleve_id'))
            ->where('annee_scolaire_id', $this->request->getJsonVar('annee_scolaire_id'))
            ->first();

        if ($existingInscription) {
            return $this->fail('Cet élève est déjà inscrit pour cette année scolaire', 400);
        }

        $data = [
            'eleve_id' => $this->request->getJsonVar('eleve_id'),
            'classe_id' => $this->request->getJsonVar('classe_id'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'date_inscription' => $this->request->getJsonVar('date_inscription'),
            'montant_inscription' => $this->request->getJsonVar('montant_inscription'),
            'montant_paye' => $this->request->getJsonVar('montant_paye') ?? 0,
            'statut' => 'reinscrit'
        ];

        try {
            $inscriptionId = $this->inscriptionModel->inscrireEleve($data);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Élève réinscrit avec succès',
                'data' => [
                    'inscription_id' => $inscriptionId
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage(), 400);
        }
    }
}
