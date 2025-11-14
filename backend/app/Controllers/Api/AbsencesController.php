<?php

namespace App\Controllers\Api;

use App\Models\PointageEleveModel;
use App\Models\EleveModel;
use App\Models\InscriptionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AbsencesController extends ResourceController
{
    use ResponseTrait;

    protected $pointageModel;
    protected $eleveModel;
    protected $inscriptionModel;

    public function __construct()
    {
        $this->pointageModel = new PointageEleveModel();
        $this->eleveModel = new EleveModel();
        $this->inscriptionModel = new InscriptionModel();
    }

    /**
     * GET /api/eleves/{id}/absences
     * Récupère les absences d'un élève
     */
    public function index($eleveId = null)
    {
        try {
            // Vérifier que l'élève existe
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            $request = service('request');

            $filters = [
                'date_debut' => $request->getGet('date_debut'),
                'date_fin' => $request->getGet('date_fin'),
                'statut' => $request->getGet('statut'),
                'classe_id' => $request->getGet('classe_id'),
                'annee_scolaire_id' => $request->getGet('annee_scolaire_id') // Nouveau filtre
            ];

            // Si aucune année scolaire n'est spécifiée, utiliser l'année courante
            if (empty($filters['annee_scolaire_id'])) {
                $filters['annee_scolaire_id'] = $this->getAnneeScolaireCourante();
            }

            $page = (int)($request->getGet('page') ?? 1);
            $perPage = (int)($request->getGet('perPage') ?? 10);

            $result = $this->pointageModel->getPointagesByEleve(
                $eleveId,
                array_filter($filters),
                $perPage,
                $page
            );

            return $this->respond([
                'status' => 'success',
                'data' => $result,
                'filters' => $filters
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Absences::index: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des absences');
        }
    }


    private function getAnneeScolaireCourante()
    {
        // Vous pouvez adapter cette méthode selon votre logique métier
        $anneeModel = new \App\Models\AnneeScolaireModel();
        $anneeCourante = $anneeModel->where('is_active', 1)->first();

        return $anneeCourante ? $anneeCourante['id'] : null;
    }

    /**
     * POST /api/eleves/{id}/absences
     * Créer un pointage/absence
     */
    public function create($eleveId = null)
    {
        log_message('info', '=== DÉBUT Absences::create ===');
        log_message('info', 'eleveId: ' . $eleveId);

        try {


            $userId = $this->getUserIdFromToken();
            log_message('info', 'User ID: ' . ($userId ?: 'NULL'));

            if (!$userId) {
                log_message('error', 'Utilisateur non authentifié');
                return $this->failUnauthorized('Utilisateur non authentifié');
            }

            $request = service('request');
            $jsonData = $request->getJSON();
            log_message('info', 'Données JSON reçues: ' . print_r($jsonData, true));

            $rules = [
                'date_pointage' => 'required|valid_date',
                'statut' => 'required|in_list[present,absent,retard,justifie,exclu]'
            ];

            if (!$this->validate($rules)) {
                $errors = $this->validator->getErrors();
                log_message('error', 'Erreurs validation: ' . print_r($errors, true));
                return $this->failValidationErrors($errors);
            }

            // Vérifier que l'élève existe
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                log_message('error', 'Élève non trouvé: ' . $eleveId);
                return $this->failNotFound('Élève non trouvé');
            }

            // Trouver l'inscription active
            $inscriptionActive = $this->inscriptionModel
                ->where('eleve_id', $eleveId)
                ->where('statut', 'inscrit')
                ->first();

            log_message('info', 'Inscription active: ' . print_r($inscriptionActive, true));

            if (!$inscriptionActive) {
                log_message('error', 'Aucune inscription active pour élève: ' . $eleveId);
                return $this->fail('Aucune inscription active trouvée pour cet élève', 400);
            }

            // Vérifier si un pointage existe déjà pour cette date
            $datePointage = $request->getJSONVar('date_pointage');
            $existingPointage = $this->pointageModel->where('eleve_id', $eleveId)
                ->where('date_pointage', $datePointage)
                ->first();

            if ($existingPointage) {
                log_message('error', 'Pointage existe déjà pour cette date: ' . $datePointage);
                return $this->fail('Un pointage existe déjà pour cette date', 409);
            }

            $data = [
                'eleve_id' => $eleveId,
                'inscription_id' => $inscriptionActive['id'],
                'date_pointage' => $datePointage,
                'statut' => $request->getJSONVar('statut'),
                'heure_arrivee' => $request->getJSONVar('heure_arrivee') ?: null,
                'heure_depart' => $request->getJSONVar('heure_depart') ?: null,
                'remarque' => $request->getJSONVar('remarque') ?: null,
                'justification' => $request->getJSONVar('justification') ?: null,
                'pointe_par' => $userId
            ];

            log_message('info', 'Données à insérer: ' . print_r($data, true));

            // Vérifier la connexion à la base de données
            $db = db_connect();
            if (!$db) {
                log_message('error', 'Impossible de se connecter à la base de données');
                return $this->failServerError('Erreur de connexion à la base de données');
            }

            $pointageId = $this->pointageModel->insert($data);

            if (!$pointageId) {
                $errors = $this->pointageModel->errors();
                log_message('error', 'Erreur insertion pointage: ' . print_r($errors, true));
                return $this->fail('Erreur lors de l\'enregistrement du pointage: ' . implode(', ', $errors));
            }

            log_message('info', 'Pointage créé avec ID: ' . $pointageId);
            log_message('info', '=== FIN Absences::create - SUCCÈS ===');

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Pointage enregistré avec succès',
                'data' => [
                    'pointage_id' => $pointageId
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'EXCEPTION Absences::create: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            log_message('info', '=== FIN Absences::create - ERREUR ===');
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/{id}/absences/statistiques
     * Récupère les statistiques d'absences
     */
    public function statistiques($eleveId = null)
    {
        try {
            // Vérifier que l'élève existe
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            $request = service('request');
            $anneeScolaireId = $request->getGet('annee_scolaire_id');

            $statistiques = $this->pointageModel->getStatistiquesAbsences($eleveId, $anneeScolaireId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'statistiques' => $statistiques
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Absences::statistiques: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la récupération des statistiques');
        }
    }

    /**
     * PUT /api/absences/{id}
     * Modifier un pointage
     */
    public function update($id = null)
    {
        $pointage = $this->pointageModel->find($id);
        if (!$pointage) {
            return $this->failNotFound('Pointage non trouvé');
        }

        $rules = [
            'statut' => 'permit_empty|in_list[present,absent,retard,justifie,exclu]',
            'heure_arrivee' => 'permit_empty|valid_time',
            'heure_depart' => 'permit_empty|valid_time',
            'remarque' => 'permit_empty|string|max_length[500]',
            'justification' => 'permit_empty|string|max_length[500]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $request = service('request');
        $data = $request->getJSON(true);

        try {
            $updated = $this->pointageModel->update($id, $data);

            if (!$updated) {
                return $this->fail('Erreur lors de la modification du pointage');
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Pointage modifié avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Absences::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification du pointage');
        }
    }

    /**
     * DELETE /api/absences/{id}
     * Supprimer un pointage
     */
    public function delete($id = null)
    {
        $pointage = $this->pointageModel->find($id);
        if (!$pointage) {
            return $this->failNotFound('Pointage non trouvé');
        }

        try {
            $deleted = $this->pointageModel->delete($id);

            if (!$deleted) {
                return $this->fail('Erreur lors de la suppression du pointage');
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Pointage supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur Absences::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression du pointage');
        }
    }

    /**
     * Récupère l'ID de l'utilisateur depuis le token JWT
     */
    private function getUserIdFromToken()
    {
        $authHeader = $this->request->getHeaderLine('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $secretKey = getenv('JWT_SECRET') ?: 'votre_cle_secrete_jwt_tres_longue_et_securisee_2025_gestion_scolaire';
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));

            return $decoded->data->user_id ?? null;
        } catch (Exception $e) {
            log_message('error', 'Erreur de décodage du JWT : ' . $e->getMessage());
            return null;
        }
    }
}
