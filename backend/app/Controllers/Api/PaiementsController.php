<?php

namespace App\Controllers\Api;

use App\Models\PaiementFraisModel;
use App\Models\InscriptionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class PaiementsController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $paiementModel;
    protected $inscriptionModel;

    public function __construct()
    {
        $this->paiementModel = new PaiementFraisModel();
        $this->inscriptionModel = new InscriptionModel();
    }

    /**
     * POST /api/paiements
     * Enregistre un nouveau paiement
     */
    public function create()
    {
        // Log des données reçues
        $jsonData = $this->request->getJSON();
        log_message('debug', 'Données reçues: ' . print_r($jsonData, true));

        $rules = [
            'inscription_id' => 'required|integer',
            'eleve_id' => 'required|integer',
            'annee_scolaire_id' => 'required|integer',
            'mois' => 'required|max_length[10]',
            'montant' => 'required|decimal',
            'date_paiement' => 'required|valid_date',
            'mode_paiement' => 'required|in_list[especes,cheque,virement,mobile]',
            'reference_paiement' => 'permit_empty|max_length[100]'
        ];

        if (!$this->validate($rules)) {
            $errors = $this->validator->getErrors();
            log_message('error', 'Validation failed: ' . print_r($errors, true));
            return $this->failValidationErrors($errors);
        }

        // Vérifier que l'inscription existe
        $inscriptionId = $this->request->getJsonVar('inscription_id');
        $inscription = $this->inscriptionModel->find($inscriptionId);
        if (!$inscription) {
            log_message('error', 'Inscription non trouvée: ' . $inscriptionId);
            return $this->failNotFound('Inscription non trouvée');
        }

        // Récupérer l'ID de l'utilisateur connecté depuis le JWT
        $userId = $this->getUserIdFromToken();
        log_message('debug', 'User ID from token: ' . $userId);

        // Calculer le statut automatiquement
        $montantPaiement = $this->request->getJsonVar('montant');
        $statut = $this->calculerStatutPaiement($inscriptionId, $montantPaiement);

        $data = [
            'inscription_id' => $inscriptionId,
            'eleve_id' => $this->request->getJsonVar('eleve_id'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'mois' => $this->request->getJsonVar('mois'),
            'montant' => $montantPaiement,
            'date_paiement' => $this->request->getJsonVar('date_paiement'),
            'mode_paiement' => $this->request->getJsonVar('mode_paiement'),
            'reference_paiement' => $this->request->getJsonVar('reference_paiement'),
            'statut' => $statut,
            'encaisse_par' => $userId
        ];

        log_message('debug', 'Données pour insertion: ' . print_r($data, true));

        try {
            $paiementId = $this->paiementModel->enregistrerPaiement($data);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Paiement enregistré avec succès',
                'data' => [
                    'paiement_id' => $paiementId,
                    'statut' => $statut
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur enregistrement paiement: ' . $e->getMessage());
            return $this->fail($e->getMessage(), 400);
        }
    }

    /**
     * Calcule le statut du paiement en fonction du montant et du solde restant
     */
    private function calculerStatutPaiement($inscriptionId, $montantPaiement)
    {
        try {
            // Récupérer le montant total de l'inscription
            $inscription = $this->inscriptionModel->find($inscriptionId);
            $montantTotal = $inscription['montant_inscription'] ?? 0;

            // Récupérer le total déjà payé
            $totalPaye = $this->paiementModel->getTotalPaye($inscriptionId);

            // Calculer le nouveau total payé après ce paiement
            $nouveauTotalPaye = $totalPaye + $montantPaiement;

            // Calculer le pourcentage payé
            $pourcentagePaye = $montantTotal > 0 ? ($nouveauTotalPaye / $montantTotal) * 100 : 0;

            log_message('debug', "Calcul statut - Total: {$montantTotal}, Déjà payé: {$totalPaye}, Nouveau paiement: {$montantPaiement}, Pourcentage: {$pourcentagePaye}%");

            // Déterminer le statut
            if ($montantPaiement <= 0) {
                return 'impaye';
            } elseif ($pourcentagePaye >= 100) {
                return 'paye'; // Complètement payé
            } elseif ($pourcentagePaye >= 50) {
                return 'partiel'; // Plus de 50% payé
            } else {
                return 'partiel'; // Moins de 50% payé
            }
        } catch (\Exception $e) {
            log_message('error', 'Erreur calcul statut: ' . $e->getMessage());
            return 'partiel'; // Statut par défaut en cas d'erreur
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

    /**
     * GET /api/inscriptions/{id}/paiements
     * Récupère les paiements d'une inscription
     */
    public function getByInscription($inscriptionId = null)
    {
        try {
            $paiements = $this->paiementModel->getPaiementsByInscription($inscriptionId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'paiements' => $paiements
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des paiements');
        }
    }

    /**
     * GET /api/eleves/{id}/paiements/annee/{anneeScolaireId}
     * Récupère les paiements d'un élève pour une année scolaire spécifique
     */
    public function getByEleveAndAnnee($eleveId = null, $anneeScolaireId = null)
    {
        try {
            $paiements = $this->paiementModel->getPaiementsByEleveAndAnnee($eleveId, $anneeScolaireId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'paiements' => $paiements
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des paiements');
        }
    }

    /**
     * GET /api/inscriptions/{id}/solde
     * Récupère le solde restant d'une inscription
     */
    public function getSolde($inscriptionId = null)
    {
        try {
            $solde = $this->paiementModel->getSoldeRestant($inscriptionId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'solde_restant' => $solde
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors du calcul du solde');
        }
    }

    /**
     * GET /api/eleves/{id}/solde/annee/{anneeScolaireId}
     * Récupère le solde restant d'un élève pour une année scolaire
     */
    public function getSoldeByEleveAndAnnee($eleveId = null, $anneeScolaireId = null)
    {
        try {
            $solde = $this->paiementModel->getSoldeRestantByEleveAndAnnee($eleveId, $anneeScolaireId);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'solde_restant' => $solde
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors du calcul du solde');
        }
    }

    /**
     * DELETE /api/paiements/{id}
     * Supprime un paiement
     */
    public function delete($id = null)
    {
        try {
            $this->paiementModel->supprimerPaiement($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Paiement supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage(), 400);
        }
    }
}
