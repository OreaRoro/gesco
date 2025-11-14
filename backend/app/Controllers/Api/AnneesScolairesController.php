<?php

namespace App\Controllers\Api;

use App\Models\AnneeScolaireModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class AnneesScolairesController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $modelName = 'App\Models\AnneeScolaireModel';
    protected $format    = 'json';

    public function __construct()
    {
        $this->model = new AnneeScolaireModel();
    }

    /**
     * Retourne la liste des années scolaires
     */
    public function index()
    {
        try {
            $annees = $this->model->getAllAnneesScolaires();

            return $this->respond([
                'success' => true,
                'data' => [
                    'annees_scolaires' => $annees
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des années scolaires');
        }
    }

    /**
     * Retourne une année scolaire spécifique
     */
    public function show($id = null)
    {
        try {
            $annee = $this->model->find($id);

            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'annee_scolaire' => $annee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::show: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération de l\'année scolaire');
        }
    }

    /**
     * Crée une nouvelle année scolaire
     */
    public function create()
    {
        try {
            $data = $this->request->getJSON(true);

            // Validation des données
            $validation = \Config\Services::validation();
            $validation->setRules([
                'annee' => 'required|max_length[20]',
                'date_debut' => 'required|valid_date',
                'date_fin' => 'required|valid_date',
                'statut' => 'required|in_list[planifie,courante,terminee,archivee]'
            ]);

            if (!$validation->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Vérifier si l'année existe déjà
            $existingAnnee = $this->model->where('annee', $data['annee'])->first();
            if ($existingAnnee) {
                return $this->fail('Cette année scolaire existe déjà', 400);
            }

            // Si on définit comme courante, désactiver les autres
            if ($data['statut'] === 'courante') {
                $this->model->where('statut', 'courante')->set(['statut' => 'terminee'])->update();
            }

            $anneeId = $this->model->insert($data);

            if (!$anneeId) {
                return $this->fail('Erreur lors de la création de l\'année scolaire');
            }

            $newAnnee = $this->model->find($anneeId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Année scolaire créée avec succès',
                'data' => [
                    'annee_scolaire' => $newAnnee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::create: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création de l\'année scolaire');
        }
    }

    /**
     * Met à jour une année scolaire
     */
    public function update($id = null)
    {
        try {
            $data = $this->request->getJSON(true);

            // Vérifier si l'année existe
            $annee = $this->model->find($id);
            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            // Vérifier si l'année existe déjà (sauf celle en cours)
            if (isset($data['annee']) && $data['annee'] !== $annee['annee']) {
                $existingAnnee = $this->model->where('annee', $data['annee'])->first();
                if ($existingAnnee) {
                    return $this->fail('Cette année scolaire existe déjà', 400);
                }
            }

            // Validation des données avec règles personnalisées pour l'update
            $validation = \Config\Services::validation();
            $validationRules = [
                'annee' => 'max_length[20]',
                'date_debut' => 'valid_date',
                'date_fin' => 'valid_date',
                'statut' => 'in_list[planifie,courante,terminee,archivee]'
            ];

            if (!$validation->setRules($validationRules)->run($data)) {
                return $this->failValidationErrors($validation->getErrors());
            }

            // Si on définit comme courante, désactiver les autres
            if (isset($data['statut']) && $data['statut'] === 'courante') {
                $this->model->where('statut', 'courante')->set(['statut' => 'terminee'])->update();
            }

            $updated = $this->model->update($id, $data);

            if (!$updated) {
                return $this->fail('Erreur lors de la modification de l\'année scolaire');
            }

            $updatedAnnee = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Année scolaire modifiée avec succès',
                'data' => [
                    'annee_scolaire' => $updatedAnnee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification de l\'année scolaire');
        }
    }

    /**
     * Supprime une année scolaire
     */
    public function delete($id = null)
    {
        try {
            $annee = $this->model->find($id);

            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            // Vérifier si l'année est utilisée dans d'autres tables
            if ($this->model->isUsed($id)) {
                return $this->fail('Impossible de supprimer cette année scolaire car elle est utilisée dans le système', 400);
            }

            $this->model->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Année scolaire supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression de l\'année scolaire');
        }
    }

    public function setActive($id = null)
    {
        try {
            $annee = $this->model->find($id);

            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            // Vérifier si l'année est déjà active
            if ($annee['is_active']) {
                return $this->respond([
                    'success' => true,
                    'message' => 'Cette année est déjà active',
                    'data' => [
                        'annee_scolaire' => $annee
                    ]
                ]);
            }

            // Désactiver seulement les années qui sont actives
            $this->model->where('is_active', true)
                ->set(['is_active' => false])
                ->update();

            // Activer la nouvelle année
            $this->model->update($id, ['is_active' => true]);

            $updatedAnnee = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Année scolaire activée',
                'data' => [
                    'annee_scolaire' => $updatedAnnee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::setActive: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la sélection de l\'année scolaire: ' . $e->getMessage());
        }
    }


    /**
     * Définit une année scolaire comme courante
     */
    public function setCurrent($id = null)
    {
        try {
            $annee = $this->model->find($id);

            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            // Récupérer l'année actuellement courante
            $ancienneAnneeCourante = $this->model->where('statut', 'courante')->first();

            // Si une année était déjà courante, la marquer comme terminée
            if ($ancienneAnneeCourante) {
                $this->model->update($ancienneAnneeCourante['id'], [
                    'statut' => 'terminee',
                    'is_active' => false
                ]);
            }

            // Définir la nouvelle année comme courante ET active
            $this->model->update($id, [
                'statut' => 'courante',
                'is_active' => true
            ]);

            $updatedAnnee = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Année scolaire définie comme courante',
                'data' => [
                    'annee_scolaire' => $updatedAnnee,
                    'ancienne_annee_courante' => $ancienneAnneeCourante
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::setCurrent: ' . $e->getMessage());
            return $this->failServerError('Erreur lors du changement d\'année scolaire courante');
        }
    }
    /**
     * Clôture une année scolaire
     */
    public function close($id = null)
    {
        try {
            $annee = $this->model->find($id);

            if (!$annee) {
                return $this->failNotFound('Année scolaire non trouvée');
            }

            if ($annee['statut'] !== 'courante') {
                return $this->fail('Seule une année scolaire en cours peut être clôturée', 400);
            }

            $this->model->update($id, ['statut' => 'terminee']);
            $updatedAnnee = $this->model->find($id);

            return $this->respond([
                'success' => true,
                'message' => 'Année scolaire clôturée avec succès',
                'data' => [
                    'annee_scolaire' => $updatedAnnee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::close: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la clôture de l\'année scolaire');
        }
    }

    /**
     * Récupère l'année scolaire courante
     */
    public function current()
    {
        try {
            $annee = $this->model->where('statut', 'courante')->first();

            if (!$annee) {
                return $this->respond([
                    'success' => true,
                    'data' => [
                        'annee_scolaire' => null
                    ]
                ]);
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'annee_scolaire' => $annee
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur AnneesScolaires::current: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération de l\'année scolaire courante');
        }
    }
}
