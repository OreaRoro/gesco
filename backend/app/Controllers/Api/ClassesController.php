<?php

namespace App\Controllers\Api;

use App\Models\ClasseModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class ClassesController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $modelName = 'App\Models\ClasseModel';
    protected $format    = 'json';

    public function __construct()
    {
        $this->model = new ClasseModel();
    }

    /**
     * Retourne la liste des classes
     */
    public function index()
    {
        try {
            $params = $this->request->getGet();

            // Filtrer par année scolaire si spécifié
            $anneeScolaireId = $params['annee_scolaire_id'] ?? null;
            $niveauId = $params['niveau_id'] ?? null;

            $classes = $this->model->getClassesWithDetails($anneeScolaireId, $niveauId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'classes' => $classes
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des classes');
        }
    }

    /**
     * Retourne une classe spécifique avec ses détails
     */
    public function show($id = null)
    {
        try {
            $classe = $this->model->getClasseWithDetails($id);

            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'classe' => $classe
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::show: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération de la classe');
        }
    }

    /**
     * Crée une nouvelle classe
     */
    public function create()
    {
        try {
            $data = $this->request->getJSON(true);

            // Conversion des int
            $data['capacite_max'] = (int) $data['capacite_max'];
            $data['niveau_id'] = (int) $data['niveau_id'];
            $data['annee_scolaire_id'] = (int) $data['annee_scolaire_id'];

            if (isset($data['professeur_principal_id'])) {
                $data['professeur_principal_id'] = $data['professeur_principal_id'] !== null
                    ? (int) $data['professeur_principal_id'] : null;
            }
            if (isset($data['surveillant_id'])) {
                $data['surveillant_id'] = $data['surveillant_id'] !== null
                    ? (int) $data['surveillant_id'] : null;
            }

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'nom' => 'required|max_length[50]',
                'niveau_id' => 'required|integer',
                'capacite_max' => 'required|integer|greater_than[0]',
                'professeur_principal_id' => 'permit_empty|integer',
                'surveillant_id' => 'permit_empty|integer',
                'annee_scolaire_id' => 'permit_empty|integer'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Vérifier si la classe existe déjà pour cette année scolaire
            $existingClasse = $this->model
                ->where('nom', $data['nom'])
                ->where('annee_scolaire_id', $data['annee_scolaire_id'] ?? null)
                ->first();

            if ($existingClasse) {
                return $this->fail('Cette classe existe déjà pour cette année scolaire', 400);
            }


            if (!$this->model->insert($data)) {
                // Récupère les erreurs de validation ou SQL
                $errors = $this->model->errors();
                return $this->failValidationErrors($errors ?: ['database' => 'Erreur inconnue lors de l’insertion']);
            }

            $classeId = $this->model->getInsertID();
            $newClasse = $this->model->getClasseWithDetails($classeId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Classe créée avec succès',
                'data' => [
                    'classe' => $newClasse
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::create: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création de la classe' . $e->getMessage());
        }
    }

    /**
     * Met à jour une classe
     */
    public function update($id = null)
    {
        try {
            $data = $this->request->getJSON(true);

            // Vérifier si la classe existe
            $classe = $this->model->find($id);
            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'nom' => 'max_length[50]',
                'niveau_id' => 'integer',
                'capacite_max' => 'integer|greater_than[0]',
                'professeur_principal_id' => 'permit_empty|integer',
                'surveillant_id' => 'permit_empty|integer',
                'annee_scolaire_id' => 'permit_empty|integer'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Vérifier si le nom existe déjà pour une autre classe de la même année
            if (isset($data['nom'])) {
                $existingClasse = $this->model
                    ->where('nom', $data['nom'])
                    ->where('annee_scolaire_id', $data['annee_scolaire_id'] ?? $classe['annee_scolaire_id'])
                    ->where('id !=', $id)
                    ->first();

                if ($existingClasse) {
                    return $this->fail('Cette classe existe déjà pour cette année scolaire', 400);
                }
            }

            $this->model->update($id, $data);
            $updatedClasse = $this->model->getClasseWithDetails($id);

            return $this->respond([
                'success' => true,
                'message' => 'Classe modifiée avec succès',
                'data' => [
                    'classe' => $updatedClasse
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification de la classe');
        }
    }

    /**
     * Supprime une classe
     */
    public function delete($id = null)
    {
        try {
            $classe = $this->model->find($id);

            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            // Vérifier si la classe a des inscriptions
            if ($this->model->hasInscriptions($id)) {
                return $this->fail('Impossible de supprimer cette classe car elle a des élèves inscrits', 400);
            }

            $this->model->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Classe supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression de la classe');
        }
    }

    /**
     * Récupère l'effectif d'une classe
     */
    public function effectif($id = null)
    {
        try {
            $effectif = $this->model->getEffectif($id);

            return $this->respond([
                'success' => true,
                'data' => [
                    'effectif' => $effectif
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::effectif: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération de l\'effectif');
        }
    }

    /**
     * Récupère les classes par niveau
     */
    public function byNiveau($niveauId = null)
    {
        try {
            if (!$niveauId) {
                return $this->fail('Niveau non spécifié');
            }

            $classes = $this->model->getByNiveau($niveauId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'classes' => $classes
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Classes::byNiveau: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des classes par niveau');
        }
    }
}
