<?php

namespace App\Controllers\Api;

use App\Models\ExamenModel;
use App\Models\NoteModel;
use App\Models\PeriodeModel;
use App\Models\AnneeScolaireModel;
use App\Models\ClasseModel;
use App\Models\MatiereModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class ExamensController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $examenModel;
    protected $noteModel;
    protected $periodeModel;
    protected $anneeScolaireModel;
    protected $classeModel;
    protected $matiereModel;

    public function __construct()
    {
        $this->examenModel = new ExamenModel();
        $this->noteModel = new NoteModel();
        $this->periodeModel = new PeriodeModel();
        $this->anneeScolaireModel = new AnneeScolaireModel();
        $this->classeModel = new ClasseModel();
        $this->matiereModel = new MatiereModel();
    }

    /**
     * GET /api/examens
     * Liste tous les examens avec pagination, recherche et filtre par année scolaire
     */
    public function index()
    {
        $page = $this->request->getGet('page') ?? 1;
        $perPage = $this->request->getGet('perPage') ?? 10;
        $search = $this->request->getGet('search') ?? '';
        $type = $this->request->getGet('type') ?? '';
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $filters = [
                'search' => $search,
                'type' => $type,
                'annee_scolaire_id' => $annee_scolaire_id
            ];

            $result = $this->examenModel->getExamensAvecPagination($page, $perPage, $filters);
            $examens = $result['examens'];
            $total = $result['total'];

            $totalPages = ceil($total / $perPage);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'examens' => $examens,
                    'filters' => [
                        'annee_scolaire_id' => $annee_scolaire_id,
                        'search' => $search,
                        'type' => $type
                    ],
                    'pagination' => [
                        'current_page' => (int)$page,
                        'per_page' => (int)$perPage,
                        'total' => $total,
                        'total_pages' => $totalPages,
                        'from' => (($page - 1) * $perPage) + 1,
                        'to' => min($page * $perPage, $total)
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des examens: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/examens/{id}
     * Récupère un examen spécifique avec ses détails
     */
    public function show($id = null)
    {
        try {
            $examen = $this->examenModel->getExamenComplet($id);

            if (!$examen) {
                return $this->failNotFound('Examen non trouvé');
            }

            // Récupérer les statistiques des notes pour cet examen
            $statistiquesNotes = $this->noteModel->getStatistiquesNotesExamen($id);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'examen' => $examen,
                    'statistiques_notes' => $statistiquesNotes
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération de l\'examen: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/examens
     * Créer un nouvel examen
     */
    public function create()
    {
        $rules = [
            'nom' => 'required|min_length[2]|max_length[100]',
            'type' => 'required|in_list[trimestriel,semestriel,annuel,composition]',
            'date_debut' => 'required|valid_date',
            'date_fin' => 'required|valid_date',
            'annee_scolaire_id' => 'required|integer',
            'periode_id' => 'permit_empty|integer'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Vérifier que l'année scolaire existe
        $anneeScolaire = $this->anneeScolaireModel->find($this->request->getJsonVar('annee_scolaire_id'));
        if (!$anneeScolaire) {
            return $this->failNotFound('Année scolaire non trouvée');
        }

        // Vérifier que la période existe si elle est spécifiée
        if ($this->request->getJsonVar('periode_id')) {
            $periode = $this->periodeModel->find($this->request->getJsonVar('periode_id'));
            if (!$periode) {
                return $this->failNotFound('Période non trouvée');
            }
        }

        $data = [
            'nom' => $this->request->getJsonVar('nom'),
            'type' => $this->request->getJsonVar('type'),
            'date_debut' => $this->request->getJsonVar('date_debut'),
            'date_fin' => $this->request->getJsonVar('date_fin'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'periode_id' => $this->request->getJsonVar('periode_id'),
            'statut' => 'planifie'
        ];

        try {
            if (!$this->examenModel->insert($data)) {
                return $this->failValidationErrors($this->examenModel->errors());
            }

            $examenId = $this->examenModel->getInsertID();
            $examen = $this->examenModel->getExamenComplet($examenId);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Examen créé avec succès',
                'data' => [
                    'examen' => $examen
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la création de l\'examen: ' . $e->getMessage());
        }
    }

    /**
     * PUT /api/examens/{id}
     * Met à jour un examen
     */
    public function update($id = null)
    {
        // Vérifier si l'examen existe
        $examen = $this->examenModel->find($id);
        if (!$examen) {
            return $this->failNotFound('Examen non trouvé');
        }

        $rules = [
            'nom' => 'required|min_length[2]|max_length[100]',
            'type' => 'required|in_list[trimestriel,semestriel,annuel,composition]',
            'date_debut' => 'required|valid_date',
            'date_fin' => 'required|valid_date',
            'annee_scolaire_id' => 'required|integer',
            'periode_id' => 'permit_empty|integer',
            'statut' => 'required|in_list[planifie,en_cours,termine,archive]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = [
            'nom' => $this->request->getJsonVar('nom'),
            'type' => $this->request->getJsonVar('type'),
            'date_debut' => $this->request->getJsonVar('date_debut'),
            'date_fin' => $this->request->getJsonVar('date_fin'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'periode_id' => $this->request->getJsonVar('periode_id'),
            'statut' => $this->request->getJsonVar('statut')
        ];

        try {
            if (!$this->examenModel->update($id, $data)) {
                return $this->failValidationErrors($this->examenModel->errors());
            }

            $examen = $this->examenModel->getExamenComplet($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Examen modifié avec succès',
                'data' => [
                    'examen' => $examen
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la mise à jour de l\'examen: ' . $e->getMessage());
        }
    }

    /**
     * DELETE /api/examens/{id}
     * Supprime un examen
     */
    public function delete($id = null)
    {
        // Vérifier si l'examen existe
        $examen = $this->examenModel->find($id);
        if (!$examen) {
            return $this->failNotFound('Examen non trouvé');
        }

        // Vérifier s'il y a des notes associées
        $notes = $this->noteModel->where('examen_id', $id)->countAllResults();
        if ($notes > 0) {
            return $this->fail('Impossible de supprimer cet examen car des notes y sont associées', 400);
        }

        try {
            if (!$this->examenModel->delete($id)) {
                return $this->fail('Erreur lors de la suppression');
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Examen supprimé avec succès',
                'data' => [
                    'examen_id' => $id
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la suppression de l\'examen: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/examens/{id}/notes
     * Récupère les notes d'un examen avec filtres
     */
    public function getNotes($examenId = null)
    {
        $classeId = $this->request->getGet('classe_id');
        $matiereId = $this->request->getGet('matiere_id');

        try {
            $examen = $this->examenModel->find($examenId);
            if (!$examen) {
                return $this->failNotFound('Examen non trouvé');
            }

            $notes = $this->noteModel->getNotesParExamen($examenId, $classeId, $matiereId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'notes' => $notes,
                    'examen' => $examen,
                    'filters' => [
                        'classe_id' => $classeId,
                        'matiere_id' => $matiereId
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des notes: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/examens/{id}/notes
     * Sauvegarde les notes pour un examen
     */
    public function sauvegarderNotes($examenId = null)
    {
        try {
            $notes = $this->request->getJsonVar('notes');

            if (!$notes || !is_array($notes)) {
                return $this->failValidationErrors('Données de notes invalides');
            }

            // Valider que l'examen existe
            $examen = $this->examenModel->find($examenId);
            if (!$examen) {
                return $this->failNotFound('Examen non trouvé');
            }

            $result = $this->noteModel->sauvegarderNotes($examenId, $notes);

            return $this->respond([
                'status' => 'success',
                'message' => count($notes) . ' notes traitées avec succès',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur sauvegarde notes: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la sauvegarde: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/examens/{id}/classes
     * Récupère les classes disponibles pour un examen
     */
    public function getClassesPourExamen($examenId = null)
    {
        try {
            $examen = $this->examenModel->find($examenId);
            if (!$examen) {
                return $this->failNotFound('Examen non trouvé');
            }

            $classes = $this->classeModel->getClassesParAnnee($examen['annee_scolaire_id']);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'classes' => $classes
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des classes: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/classes/{classeId}/matieres
     * Récupère les matières d'une classe
     */
    public function getMatieresPourClasse($classeId = null)
    {
        try {
            $classe = $this->classeModel->find($classeId);
            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            $matieres = $this->matiereModel->getMatieresParNiveau($classe['niveau_id']);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'matieres' => $matieres
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des matières: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/examens/{id}/statistiques
     * Récupère les statistiques d'un examen
     */
    public function getStatistiques($examenId = null)
    {
        try {
            $examen = $this->examenModel->find($examenId);
            if (!$examen) {
                return $this->failNotFound('Examen non trouvé');
            }

            $statistiques = $this->noteModel->getStatistiquesCompletesExamen($examenId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'statistiques' => $statistiques,
                    'examen' => $examen
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des statistiques: ' . $e->getMessage());
        }
    }

    /**
     * PATCH /api/examens/{id}/changer-statut
     * Change le statut d'un examen
     */
    public function changerStatut($id = null)
    {
        // Vérifier si l'examen existe
        $examen = $this->examenModel->find($id);
        if (!$examen) {
            return $this->failNotFound('Examen non trouvé');
        }

        $rules = [
            'statut' => 'required|in_list[planifie,en_cours,termine,archive]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $nouveauStatut = $this->request->getJsonVar('statut');

        try {
            $this->examenModel->update($id, ['statut' => $nouveauStatut]);

            return $this->respond([
                'status' => 'success',
                'message' => 'Statut de l\'examen modifié avec succès',
                'data' => [
                    'examen_id' => $id,
                    'nouveau_statut' => $nouveauStatut
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors du changement de statut: ' . $e->getMessage());
        }
    }
}
