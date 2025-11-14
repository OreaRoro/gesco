<?php

namespace App\Controllers\Api;

use App\Models\PersonnelModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class PersonnelsController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $model;

    public function __construct()
    {
        $this->model = new PersonnelModel();
    }

    /**
     * Retourne la liste du personnel
     */
    public function index()
    {
        try {
            $filters = $this->request->getGet();

            $personnel = $this->model->getAllPersonnel($filters);

            return $this->respond([
                'success' => true,
                'data' => [
                    'personnel' => $personnel,
                    'total' => count($personnel)
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération du personnel');
        }
    }

    /**
     * Retourne un membre du personnel spécifique
     */
    public function show($id = null)
    {
        try {
            $personnel = $this->model->find($id);

            if (!$personnel) {
                return $this->failNotFound('Membre du personnel non trouvé');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'personnel' => $personnel
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::show: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération du membre du personnel');
        }
    }

    /**
     * Crée un nouveau membre du personnel
     */
    public function create()
    {
        try {
            $data = $this->request->getJSON(true);

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'nom' => 'required|max_length[100]',
                'prenom' => 'required|max_length[100]',
                'sexe' => 'permit_empty|in_list[M,F]',
                'type_personnel' => 'required|in_list[enseignant,surveillant,administratif,menage,direction,autre]',
                'date_embauche' => 'required|valid_date',
                'statut' => 'required|in_list[actif,inactif,congé,licencie]',
                'email' => 'permit_empty|valid_email',
                'telephone' => 'permit_empty|max_length[20]',
                'salaire_base' => 'permit_empty|decimal'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Le matricule est généré automatiquement dans le modèle
            $personnelId = $this->model->insert($data);

            if (!$personnelId) {
                return $this->fail('Erreur lors de la création du membre du personnel');
            }

            $newPersonnel = $this->model->find($personnelId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Membre du personnel créé avec succès',
                'data' => [
                    'personnel' => $newPersonnel
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::create: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création du membre du personnel');
        }
    }

    /**
     * Met à jour un membre du personnel
     */
    public function update($id = null)
    {
        try {
            $data = $this->request->getJSON(true);

            // Vérifier si le personnel existe
            $personnel = $this->model->find($id);
            if (!$personnel) {
                return $this->failNotFound('Membre du personnel non trouvé');
            }

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'nom' => 'max_length[100]',
                'prenom' => 'max_length[100]',
                'sexe' => 'permit_empty|in_list[M,F]',
                'type_personnel' => 'in_list[enseignant,surveillant,administratif,menage,direction,autre]',
                'date_embauche' => 'valid_date',
                'statut' => 'in_list[actif,inactif,congé,licencie]',
                'email' => 'permit_empty|valid_email',
                'telephone' => 'permit_empty|max_length[20]',
                'salaire_base' => 'permit_empty|decimal'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Ne pas permettre la modification du matricule
            if (isset($data['matricule'])) {
                unset($data['matricule']);
            }

            $this->model->update($id, $data);
            $updatedPersonnel = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Membre du personnel modifié avec succès',
                'data' => [
                    'personnel' => $updatedPersonnel
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification du membre du personnel');
        }
    }

    /**
     * Supprime un membre du personnel
     */
    public function delete($id = null)
    {
        try {
            $personnel = $this->model->find($id);

            if (!$personnel) {
                return $this->failNotFound('Membre du personnel non trouvé');
            }

            // Vérifier si le personnel est utilisé dans d'autres tables
            if ($this->model->isUsed($id)) {
                return $this->fail('Impossible de supprimer ce membre du personnel car il est utilisé dans le système', 400);
            }

            $this->model->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Membre du personnel supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression du membre du personnel');
        }
    }

    /**
     * Récupère les enseignants
     */
    public function enseignants()
    {
        try {
            $enseignants = $this->model->getEnseignants();

            return $this->respond([
                'success' => true,
                'data' => [
                    'enseignants' => $enseignants
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::enseignants: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des enseignants');
        }
    }

    /**
     * Récupère les surveillants
     */
    public function surveillants()
    {
        try {
            $surveillants = $this->model->getSurveillants();

            return $this->respond([
                'success' => true,
                'data' => [
                    'surveillants' => $surveillants
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::surveillants: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des surveillants');
        }
    }

    /**
     * Récupère le personnel administratif
     */
    public function administratif()
    {
        try {
            $administratif = $this->model->getAdministratif();

            return $this->respond([
                'success' => true,
                'data' => [
                    'administratif' => $administratif
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::administratif: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération du personnel administratif');
        }
    }

    /**
     * Récupère les statistiques du personnel
     */
    public function stats()
    {
        try {
            $stats = $this->model->getStats();

            return $this->respond([
                'success' => true,
                'data' => [
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::stats: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des statistiques du personnel');
        }
    }

    /**
     * Met à jour le statut d'un membre du personnel
     */
    public function updateStatut($id = null)
    {
        try {
            $data = $this->request->getJSON(true);

            // Vérifier si le personnel existe
            $personnel = $this->model->find($id);
            if (!$personnel) {
                return $this->failNotFound('Membre du personnel non trouvé');
            }

            if (!isset($data['statut'])) {
                return $this->fail('Le statut est requis');
            }

            $this->model->updateStatut($id, $data['statut']);
            $updatedPersonnel = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Statut mis à jour avec succès',
                'data' => [
                    'personnel' => $updatedPersonnel
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::updateStatut: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la mise à jour du statut');
        }
    }

    /**
     * Recherche du personnel
     */
    public function search($term = null)
    {
        try {
            if (!$term) {
                $term = $this->request->getGet('q');
            }

            if (!$term) {
                return $this->fail('Terme de recherche requis');
            }

            $results = $this->model->search($term);

            return $this->respond([
                'success' => true,
                'data' => [
                    'results' => $results,
                    'total' => count($results)
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Personnel::search: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la recherche');
        }
    }
}
