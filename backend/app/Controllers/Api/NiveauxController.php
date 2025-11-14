<?php

namespace App\Controllers\Api;

use App\Models\NiveauModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class NiveauxController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $model;

    public function __construct()
    {
        $this->model = new NiveauModel();
    }

    /**
     * Retourne la liste des niveaux
     */
    public function index()
    {
        try {
            $niveaux = $this->model->getAllNiveaux();

            return $this->respond([
                'success' => true,
                'data' => [
                    'niveaux' => $niveaux
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur NiveauxController::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des niveaux' . $e->getMessage());
        }
    }

    /**
     * Retourne un niveau spécifique
     */
    public function show($id = null)
    {
        try {
            $niveau = $this->model->find($id);

            if (!$niveau) {
                return $this->failNotFound('Niveau non trouvé');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'niveau' => $niveau
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::show: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération du niveau');
        }
    }

    /**
     * Crée un nouveau niveau
     */
    public function create()
    {
        try {
            $data = $this->request->getJSON(true);

            // Conversion explicite de l'ordre en entier
            if (isset($data['ordre'])) {
                $data['ordre'] = (int) $data['ordre'];
            }

            $rules = [
                'nom' => 'required|max_length[50]',
                'cycle' => 'required|max_length[50]',
                'ordre' => 'required|integer|greater_than[0]'
            ];

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            $niveauId = $this->model->insert($data);

            if ($niveauId === false) {
                // Récupération des erreurs du modèle (ex: is_unique)
                $errors = $this->model->errors();

                if (!empty($errors)) {
                    return $this->failValidationErrors($errors);
                }

                return $this->fail('Erreur lors de la création du niveau');
            }

            $newNiveau = $this->model->find($niveauId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Niveau créé avec succès',
                'data' => [
                    'niveau' => $newNiveau
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::create: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création du niveau' . $e->getMessage());
        }
    }

    /**
     * Met à jour un niveau
     */
    public function update($id = null)
    {
        // Vérifier si le niveau existe
        $niveau = $this->model->find($id);
        if (!$niveau) {
            return $this->failNotFound('Niveau non trouvé');
        }

        $rules = [
            'nom'   => "required|max_length[50]|is_unique[niveaux.nom,id,{$id}]",
            'cycle' => 'required|max_length[50]',
            'ordre' => 'required|integer|greater_than[0]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }
        $data = [
            'nom' => $this->request->getJsonVar('nom'),
            'cycle' => $this->request->getJsonVar('cycle'),
            'ordre' => $this->request->getJsonVar('ordre'),
        ];
        try {
            if (!$this->model->update($id, $data)) {
                return $this->failValidationErrors($this->model->errors());
            }
            $this->model->update($id, $data);
            $updatedNiveau = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Niveau modifié avec succès',
                'data' => [
                    'niveau' => $updatedNiveau
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification du niveau');
        }
    }

    /**
     * Supprime un niveau
     */
    public function delete($id = null)
    {
        try {
            $niveau = $this->model->find($id);

            if (!$niveau) {
                return $this->failNotFound('Niveau non trouvé');
            }

            // Vérifier si le niveau est utilisé dans des classes
            if ($this->model->isUsed($id)) {
                return $this->fail('Impossible de supprimer ce niveau car il est utilisé dans des classes', 400);
            }

            $this->model->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Niveau supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression du niveau');
        }
    }

    /**
     * Récupère les niveaux par cycle
     */
    public function byCycle($cycle = null)
    {
        try {
            if (!$cycle) {
                return $this->fail('Cycle non spécifié');
            }

            $niveaux = $this->model->where('cycle', $cycle)->orderBy('ordre', 'ASC')->findAll();

            return $this->respond([
                'success' => true,
                'data' => [
                    'niveaux' => $niveaux
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::byCycle: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des niveaux par cycle');
        }
    }

    /**
     * Récupère la liste des cycles disponibles
     */
    public function cycles()
    {
        try {
            $cycles = $this->model->getCycles();

            return $this->respond([
                'success' => true,
                'data' => [
                    'cycles' => $cycles
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Niveaux::cycles: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des cycles');
        }
    }
}
