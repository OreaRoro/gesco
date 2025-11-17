<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\SalaireModel;
use App\Models\PersonnelModel;
use CodeIgniter\API\ResponseTrait;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class SalairesController extends BaseController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $salaireModel;
    protected $personnelModel;

    public function __construct()
    {
        $this->salaireModel = new SalaireModel();
        $this->personnelModel = new PersonnelModel();
    }

    public function index()
    {
        try {
            $filters = [
                'mois' => $this->request->getGet('mois'),
                'annee_scolaire_id' => $this->request->getGet('annee_scolaire_id'),
                'personnel_id' => $this->request->getGet('personnel_id'),
                'statut_paiement' => $this->request->getGet('statut_paiement'),
                'type_personnel' => $this->request->getGet('type_personnel')
            ];

            // Nettoyer les filtres vides
            $filters = array_filter($filters, function ($value) {
                return $value !== null && $value !== '';
            });

            log_message('info', 'Filtres salaires: ' . print_r($filters, true));

            $salaires = $this->salaireModel->getFiltered($filters);

            return $this->respond([
                'success' => true,
                'data' => [
                    'salaires' => $salaires
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::index: ' . $e->getMessage());
            log_message('error', $e->getTraceAsString());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    public function show($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $salaire = $this->salaireModel->find($id);

            if (!$salaire) {
                return $this->failNotFound('Fiche de salaire non trouvée');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'salaire' => $salaire
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::show: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur');
        }
    }

    public function create()
    {
        try {
            // Récupérer les données JSON
            $json = $this->request->getJSON(true);

            // Utiliser les données JSON si disponibles, sinon utiliser POST normal
            $inputData = $json ?: $this->request->getPost();

            log_message('info', 'Données reçues pour création salaire: ' . print_r($inputData, true));
            log_message('info', 'Content-Type: ' . $this->request->getHeaderLine('Content-Type'));

            $rules = [
                'personnel_id' => 'required|integer',
                'annee_scolaire_id' => 'required|integer',
                'mois' => 'required|regex_match[/^\d{4}-\d{2}$/]',
                'salaire_base' => 'required|decimal',
                'salaire_net' => 'required|decimal',
                'statut_paiement' => 'required|in_list[paye,impaye]'
            ];

            if (!$this->validate($rules)) {
                $errors = $this->validator->getErrors();
                log_message('error', 'Erreurs de validation: ' . print_r($errors, true));
                return $this->failValidationErrors($errors);
            }

            $data = [
                'personnel_id' => $inputData['personnel_id'],
                'annee_scolaire_id' => $inputData['annee_scolaire_id'],
                'mois' => $inputData['mois'],
                'salaire_base' => $inputData['salaire_base'],
                'prime' => $inputData['prime'] ?? 0,
                'heures_supp' => $inputData['heures_supp'] ?? 0,
                'taux_heure_supp' => $inputData['taux_heure_supp'] ?? 0,
                'deduction' => $inputData['deduction'] ?? 0,
                'salaire_net' => $inputData['salaire_net'],
                'statut_paiement' => $inputData['statut_paiement'],
                'date_paiement' => ($inputData['statut_paiement'] === 'paye') ? date('Y-m-d') : null,
                'paye_par' => ($inputData['statut_paiement'] === 'paye') ? $this->getUserIdFromToken() : null
            ];

            log_message('info', 'Données préparées pour insertion: ' . print_r($data, true));

            // Vérifier si une fiche existe déjà
            $existing = $this->salaireModel
                ->where('personnel_id', $data['personnel_id'])
                ->where('mois', $data['mois'])
                ->first();

            if ($existing) {
                log_message('warning', 'Salaire déjà existant pour personnel ' . $data['personnel_id'] . ' mois ' . $data['mois']);
                return $this->fail('Une fiche de salaire existe déjà pour ce personnel ce mois-ci');
            }

            // Tenter l'insertion
            $insertResult = $this->salaireModel->insert($data);

            if (!$insertResult) {
                $dbError = $this->salaireModel->errors();
                log_message('error', 'Erreur insertion base de données: ' . print_r($dbError, true));
                return $this->fail('Erreur lors de l\'insertion en base de données');
            }

            $salaireId = $this->salaireModel->getInsertID();
            log_message('info', 'Salaire créé avec ID: ' . $salaireId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Fiche de salaire créée avec succès',
                'data' => [
                    'id' => $salaireId
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Exception dans Salaires::create: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            return $this->failServerError('Erreur lors de la création: ' . $e->getMessage());
        }
    }

    public function update($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $salaire = $this->salaireModel->find($id);

            if (!$salaire) {
                return $this->failNotFound('Fiche de salaire non trouvée');
            }

            // Récupérer les données JSON
            $json = $this->request->getJSON(true);
            $inputData = $json ?: $this->request->getPost();

            $rules = [
                'personnel_id' => 'required|integer',
                'annee_scolaire_id' => 'required|integer',
                'mois' => 'required|regex_match[/^\d{4}-\d{2}$/]',
                'salaire_base' => 'required|decimal',
                'salaire_net' => 'required|decimal',
                'statut_paiement' => 'required|in_list[paye,impaye]'
            ];

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            $data = [
                'personnel_id' => $inputData['personnel_id'],
                'annee_scolaire_id' => $inputData['annee_scolaire_id'],
                'mois' => $inputData['mois'],
                'salaire_base' => $inputData['salaire_base'],
                'prime' => $inputData['prime'] ?? 0,
                'heures_supp' => $inputData['heures_supp'] ?? 0,
                'taux_heure_supp' => $inputData['taux_heure_supp'] ?? 0,
                'deduction' => $inputData['deduction'] ?? 0,
                'salaire_net' => $inputData['salaire_net'],
                'statut_paiement' => $inputData['statut_paiement'],
                'date_paiement' => ($inputData['statut_paiement'] === 'paye') ? date('Y-m-d') : null,
                'paye_par' => ($inputData['statut_paiement'] === 'paye') ? $this->getUserIdFromToken() : null
            ];

            $this->salaireModel->update($id, $data);

            return $this->respond([
                'success' => true,
                'message' => 'Fiche de salaire modifiée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::update: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification: ' . $e->getMessage());
        }
    }

    public function delete($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $salaire = $this->salaireModel->find($id);

            if (!$salaire) {
                return $this->failNotFound('Fiche de salaire non trouvée');
            }

            $this->salaireModel->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Fiche de salaire supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::delete: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression: ' . $e->getMessage());
        }
    }

    public function payer($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $salaire = $this->salaireModel->find($id);

            if (!$salaire) {
                return $this->failNotFound('Fiche de salaire non trouvée');
            }

            $datePaiement = $this->request->getPost('date_paiement') ?: date('Y-m-d');

            $data = [
                'statut_paiement' => 'paye',
                'date_paiement' => $datePaiement,
                'paye_par' => $this->getUserIdFromToken()
            ];

            $this->salaireModel->update($id, $data);

            return $this->respond([
                'success' => true,
                'message' => 'Salaire marqué comme payé avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::payer: ' . $e->getMessage());
            return $this->failServerError('Erreur lors du paiement: ' . $e->getMessage());
        }
    }

    public function bulletin($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $salaire = $this->salaireModel->getWithPersonnel($id);

            if (!$salaire) {
                return $this->failNotFound('Fiche de salaire non trouvée');
            }

            // Générer les détails du bulletin
            $details = [
                [
                    'libelle' => 'Salaire de base',
                    'montant' => (float)$salaire['salaire_base'],
                    'type' => 'gain'
                ],
                [
                    'libelle' => 'Prime',
                    'montant' => (float)$salaire['prime'],
                    'type' => 'gain'
                ],
                [
                    'libelle' => 'Heures supplémentaires',
                    'montant' => (float)$salaire['heures_supp'] * (float)$salaire['taux_heure_supp'],
                    'type' => 'gain'
                ],
                [
                    'libelle' => 'Déductions',
                    'montant' => (float)$salaire['deduction'],
                    'type' => 'deduction'
                ]
            ];

            $bulletin = [
                'salaire' => $salaire,
                'personnel' => [
                    'nom' => $salaire['nom'],
                    'prenom' => $salaire['prenom'],
                    'matricule' => $salaire['matricule'],
                    'type_personnel' => $salaire['type_personnel']
                ],
                'details' => $details
            ];

            return $this->respond([
                'success' => true,
                'data' => [
                    'bulletin' => $bulletin
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Salaires::bulletin: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la génération du bulletin: ' . $e->getMessage());
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
