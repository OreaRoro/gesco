<?php

namespace App\Controllers\Api;

use App\Models\MatiereModel;
use App\Models\NiveauModel;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class MatiereController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $model;
    protected $niveauModel;

    public function __construct()
    {
        $this->model = new MatiereModel();
        $this->niveauModel = new NiveauModel();
    }

    /**
     * Retourne la liste des matières
     * GET /api/matieres
     */
    public function index()
    {
        try {
            // Récupérer les filtres
            $filters = [
                'search' => $this->request->getGet('search'),
                'niveau_id' => $this->request->getGet('niveau_id')
            ];

            // Nettoyer les filtres
            $filters = array_filter($filters, function ($value) {
                return $value !== null && $value !== '';
            });

            $matieres = $this->model->getAllWithNiveau($filters);

            return $this->respond([
                'success' => true,
                'data' => [
                    'matieres' => $matieres
                ],
                'message' => 'Liste des matières récupérée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la récupération des matières: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la récupération des matières',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retourne une matière spécifique
     * GET /api/matieres/{id}
     */
    public function show($id = null)
    {
        try {
            $matiere = $this->model->getWithNiveau($id);

            if (!$matiere) {
                return $this->respond([
                    'success' => false,
                    'message' => 'Matière non trouvée'
                ], 404);
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'matiere' => $matiere
                ],
                'message' => 'Matière récupérée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la récupération de la matière: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la matière',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée une nouvelle matière
     * POST /api/matieres
     */
    public function create()
    {
        try {
            // Récupérer les données
            $data = $this->request->getJSON(true);

            // Validation manuelle pour le code unique
            if (isset($data['code']) && !$this->model->isCodeUnique($data['code'])) {
                return $this->respond([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => [
                        'code' => 'Ce code de matière est déjà utilisé'
                    ]
                ], 422);
            }

            // Insertion
            $matiereId = $this->model->insert($data);

            if (!$matiereId) {
                $errors = $this->model->errors();

                return $this->respond([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $errors
                ], 422);
            }

            // Récupérer la matière créée
            $matiere = $this->model->getWithNiveau($matiereId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'matiere' => $matiere
                ],
                'message' => 'Matière créée avec succès'
            ], 201);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la création de la matière: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la création de la matière',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour une matière
     * PUT /api/matieres/{id}
     */
    public function update($id = null)
    {
        // Vérifier si la matière existe
        $existingMatiere = $this->model->find($id);
        if (!$existingMatiere) {
            return $this->respond([
                'success' => false,
                'message' => 'Matière non trouvée'
            ], 404);
        }

        // Récupérer les données
        $data = $this->request->getJSON(true);

        $rules = [
            'nom' => "required|min_length[2]|max_length[100]|is_unique[matieres.code,id,{$id}]",
            'code' => "required|alpha_numeric|max_length[20]|is_unique[matieres.code,id,{$id}]",
            'coefficient' => 'required|integer|greater_than[0]|less_than[6]',
            'niveau_id' => 'required|integer'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Validation manuelle pour le code unique
        // if (isset($data['code']) && !$this->model->isCodeUnique($data['code'], $id)) {
        //     return $this->respond([
        //         'success' => false,
        //         'message' => 'Erreur de validation',
        //         'errors' => [
        //             'code' => 'Ce code de matière est déjà utilisé'
        //         ]
        //     ], 422);
        // }
        try {

            // Mise à jour
            $updated = $this->model->update($id, $data);

            if (!$updated) {
                $errors = $this->model->errors();

                return $this->respond([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $errors
                ], 422);
            }

            // Récupérer la matière mise à jour
            $matiere = $this->model->getWithNiveau($id);

            return $this->respond([
                'success' => true,
                'data' => [
                    'matiere' => $matiere
                ],
                'message' => 'Matière modifiée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la modification de la matière: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la modification de la matière',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime une matière
     * DELETE /api/matieres/{id}
     */
    public function delete($id = null)
    {
        try {
            // Vérifier si la matière existe
            $matiere = $this->model->find($id);
            if (!$matiere) {
                return $this->respond([
                    'success' => false,
                    'message' => 'Matière non trouvée'
                ], 404);
            }

            // Vérifier les contraintes de clé étrangère (optionnel)
            // Vous pouvez ajouter des vérifications ici si nécessaire

            // Suppression
            $deleted = $this->model->delete($id);

            if (!$deleted) {
                return $this->respond([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression de la matière'
                ], 500);
            }

            return $this->respond([
                'success' => true,
                'message' => 'Matière supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la suppression de la matière: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la matière',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les matières par niveau
     * GET /api/niveaux/{id}/matieres
     */
    public function getByNiveau($niveauId = null)
    {
        try {
            $matieres = $this->model->getByNiveau($niveauId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'matieres' => $matieres
                ],
                'message' => 'Matières du niveau récupérées avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur lors de la récupération des matières du niveau: ' . $e->getMessage());

            return $this->respond([
                'success' => false,
                'message' => 'Erreur lors de la récupération des matières du niveau',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
