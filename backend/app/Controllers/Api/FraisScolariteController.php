<?php

namespace App\Controllers\Api;

use App\Models\FraisScolariteModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class FraisScolariteController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $model;

    public function __construct()
    {
        $this->model = new FraisScolariteModel();
    }

    /**
     * Retourne la liste des frais de scolarité
     */
    public function index()
    {
        try {
            $params = $this->request->getGet();
            $frais = $this->model->getAllFrais($params);

            return $this->respond([
                'success' => true,
                'data' => [
                    'frais_scolarite' => $frais
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des frais de scolarité');
        }
    }

    /**
     * Retourne les frais pour un niveau spécifique
     */
    public function getByNiveau()
    {
        try {
            $niveauId = $this->request->getGet('niveau_id');
            $anneeScolaireId = $this->request->getGet('annee_scolaire_id');

            if (!$niveauId) {
                return $this->fail('ID du niveau requis');
            }

            $frais = $this->model->getByNiveau($niveauId, $anneeScolaireId);

            if (!$frais) {
                return $this->failNotFound('Aucun frais configuré pour ce niveau');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'frais' => $frais
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::getByNiveau: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des frais');
        }
    }

    /**
     * Retourne les frais pour une classe
     */
    public function getByClasse($classeId = null)
    {
        try {
            $frais = $this->model->getByClasse($classeId);

            if (!$frais) {
                return $this->failNotFound('Aucun frais configuré pour cette classe');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'frais' => $frais
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::getByClasse: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des frais');
        }
    }

    /**
     * Crée de nouveaux frais de scolarité
     */
    public function create()
    {
        try {
            $data = $this->request->getJSON(true);

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'niveau_id' => 'required|integer',
                'annee_scolaire_id' => 'required|integer',
                'montant' => 'required|decimal',
                'frais_inscription' => 'required|decimal',
                'frais_dossier' => 'required|decimal'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Vérifier si les frais existent déjà pour ce niveau et cette année
            $existingFrais = $this->model->where('niveau_id', $data['niveau_id'])
                ->where('annee_scolaire_id', $data['annee_scolaire_id'])
                ->first();

            if ($existingFrais) {
                return $this->fail('Des frais existent déjà pour ce niveau et cette année scolaire', 400);
            }

            $fraisId = $this->model->insert($data);

            if (!$fraisId) {
                return $this->fail('Erreur lors de la création des frais');
            }

            $newFrais = $this->model->getWithDetails($fraisId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Frais de scolarité créés avec succès',
                'data' => [
                    'frais_scolarite' => $newFrais
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::create: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création des frais de scolarité');
        }
    }

    /**
     * Met à jour les frais de scolarité
     */
    public function update($id = null)
    {
        try {
            $data = $this->request->getJSON(true);

            // Vérifier si les frais existent
            $frais = $this->model->find($id);
            if (!$frais) {
                return $this->failNotFound('Frais de scolarité non trouvés');
            }

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'niveau_id' => 'integer',
                'annee_scolaire_id' => 'integer',
                'montant' => 'decimal',
                'frais_inscription' => 'decimal',
                'frais_dossier' => 'decimal'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            $this->model->update($id, $data);
            $updatedFrais = $this->model->getWithDetails($id);

            return $this->respond([
                'success' => true,
                'message' => 'Frais de scolarité modifiés avec succès',
                'data' => [
                    'frais_scolarite' => $updatedFrais
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification des frais de scolarité');
        }
    }

    /**
     * Supprime les frais de scolarité
     */
    public function delete($id = null)
    {
        try {
            $frais = $this->model->find($id);

            if (!$frais) {
                return $this->failNotFound('Frais de scolarité non trouvés');
            }

            $this->model->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Frais de scolarité supprimés avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur FraisScolarite::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression des frais de scolarité');
        }
    }
}
