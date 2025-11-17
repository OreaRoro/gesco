<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\PointagePersonnelModel;
use App\Models\PersonnelModel;
use CodeIgniter\API\ResponseTrait;

class PointagesController extends BaseController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $pointagePersonnelModel;
    protected $personnelModel;

    public function __construct()
    {
        $this->pointagePersonnelModel = new PointagePersonnelModel();
        $this->personnelModel = new PersonnelModel();
    }

    // Pointage du personnel
    public function personnel()
    {
        try {
            $filters = [
                'date_debut' => $this->request->getGet('date_debut'),
                'date_fin' => $this->request->getGet('date_fin'),
                'personnel_id' => $this->request->getGet('personnel_id'),
                'statut' => $this->request->getGet('statut'),
                'type_personnel' => $this->request->getGet('type_personnel')
            ];

            // Nettoyer les filtres vides
            $filters = array_filter($filters, function ($value) {
                return $value !== null && $value !== '';
            });

            log_message('info', 'Filtres pointage personnel: ' . print_r($filters, true));

            $pointages = $this->pointagePersonnelModel->getFiltered($filters);

            return $this->respond([
                'success' => true,
                'data' => [
                    'pointages' => $pointages
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::personnel: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    public function showPersonnel($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $pointage = $this->pointagePersonnelModel->find($id);

            if (!$pointage) {
                return $this->failNotFound('Pointage non trouvé');
            }

            return $this->respond([
                'success' => true,
                'data' => [
                    'pointage' => $pointage
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::showPersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur');
        }
    }

    public function createPersonnel()
    {
        try {
            // Récupérer les données JSON
            $json = $this->request->getJSON(true);
            $inputData = $json ?: $this->request->getPost();

            log_message('info', 'Données reçues pour création pointage personnel: ' . print_r($inputData, true));

            $rules = [
                'personnel_id' => 'required|integer',
                'date_pointage' => 'required|valid_date',
                'statut' => 'required|in_list[present,absent,retard,congé,maladie]'
            ];

            // Les heures sont requises seulement si présent - utiliser regex pour valider le format time
            if (($inputData['statut'] ?? '') === 'present') {
                $rules['heure_arrivee'] = 'required|regex_match[/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/]';
                $rules['heure_depart'] = 'required|regex_match[/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/]';
            }

            if (!$this->validate($rules)) {
                $errors = $this->validator->getErrors();
                log_message('error', 'Erreurs de validation: ' . print_r($errors, true));
                return $this->failValidationErrors($errors);
            }

            // Calculer les heures de travail si présent
            $heuresTravail = 0;
            if ($inputData['statut'] === 'present' && !empty($inputData['heure_arrivee']) && !empty($inputData['heure_depart'])) {
                $heuresTravail = $this->calculerHeuresTravail(
                    $inputData['heure_arrivee'],
                    $inputData['heure_depart']
                );
            }

            $data = [
                'personnel_id' => $inputData['personnel_id'],
                'date_pointage' => $inputData['date_pointage'],
                'heure_arrivee' => $inputData['statut'] === 'present' ? ($inputData['heure_arrivee'] ?? null) : null,
                'heure_depart' => $inputData['statut'] === 'present' ? ($inputData['heure_depart'] ?? null) : null,
                'statut' => $inputData['statut'],
                'heures_travail' => $heuresTravail,
                'remarque' => $inputData['remarque'] ?? null,
                'pointe_par' => 3 // ID de l'utilisateur admin
            ];

            log_message('info', 'Données préparées pour insertion: ' . print_r($data, true));

            // Vérifier si un pointage existe déjà pour ce personnel cette date
            $existing = $this->pointagePersonnelModel
                ->where('personnel_id', $data['personnel_id'])
                ->where('date_pointage', $data['date_pointage'])
                ->first();

            if ($existing) {
                log_message('warning', 'Pointage déjà existant pour personnel ' . $data['personnel_id'] . ' date ' . $data['date_pointage']);
                return $this->fail('Un pointage existe déjà pour ce personnel à cette date');
            }

            // Tenter l'insertion
            $insertResult = $this->pointagePersonnelModel->insert($data);

            if (!$insertResult) {
                $dbError = $this->pointagePersonnelModel->errors();
                log_message('error', 'Erreur insertion base de données: ' . print_r($dbError, true));
                return $this->fail('Erreur lors de l\'insertion en base de données');
            }

            $pointageId = $this->pointagePersonnelModel->getInsertID();
            log_message('info', 'Pointage créé avec ID: ' . $pointageId);

            return $this->respondCreated([
                'success' => true,
                'message' => 'Pointage créé avec succès',
                'data' => [
                    'id' => $pointageId
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Exception dans Pointages::createPersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création: ' . $e->getMessage());
        }
    }

    public function updatePersonnel($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $pointage = $this->pointagePersonnelModel->find($id);

            if (!$pointage) {
                return $this->failNotFound('Pointage non trouvé');
            }

            // Récupérer les données JSON
            $json = $this->request->getJSON(true);
            $inputData = $json ?: $this->request->getPost();

            $rules = [
                'personnel_id' => 'required|integer',
                'date_pointage' => 'required|valid_date',
                'statut' => 'required|in_list[present,absent,retard,congé,maladie]'
            ];

            // Les heures sont requises seulement si présent - utiliser regex pour valider le format time
            if (($inputData['statut'] ?? '') === 'present') {
                $rules['heure_arrivee'] = 'required|regex_match[/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/]';
                $rules['heure_depart'] = 'required|regex_match[/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/]';
            }

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            // Calculer les heures de travail si présent
            $heuresTravail = 0;
            if ($inputData['statut'] === 'present' && !empty($inputData['heure_arrivee']) && !empty($inputData['heure_depart'])) {
                $heuresTravail = $this->calculerHeuresTravail(
                    $inputData['heure_arrivee'],
                    $inputData['heure_depart']
                );
            }

            $data = [
                'personnel_id' => $inputData['personnel_id'],
                'date_pointage' => $inputData['date_pointage'],
                'heure_arrivee' => $inputData['statut'] === 'present' ? ($inputData['heure_arrivee'] ?? null) : null,
                'heure_depart' => $inputData['statut'] === 'present' ? ($inputData['heure_depart'] ?? null) : null,
                'statut' => $inputData['statut'],
                'heures_travail' => $heuresTravail,
                'remarque' => $inputData['remarque'] ?? null
            ];

            $this->pointagePersonnelModel->update($id, $data);

            return $this->respond([
                'success' => true,
                'message' => 'Pointage modifié avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::updatePersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la modification: ' . $e->getMessage());
        }
    }

    public function deletePersonnel($id = null)
    {
        try {
            if (!$id) {
                return $this->failNotFound('ID non fourni');
            }

            $pointage = $this->pointagePersonnelModel->find($id);

            if (!$pointage) {
                return $this->failNotFound('Pointage non trouvé');
            }

            $this->pointagePersonnelModel->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Pointage supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::deletePersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la suppression: ' . $e->getMessage());
        }
    }

    public function rapidePersonnel()
    {
        try {
            // Récupérer les données JSON
            $json = $this->request->getJSON(true);
            $inputData = $json ?: $this->request->getPost();

            log_message('info', 'Pointage rapide reçu: ' . print_r($inputData, true));

            $rules = [
                'personnel_id' => 'required|integer',
                'type' => 'required|in_list[arrivee,depart]'
            ];

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            $personnelId = $inputData['personnel_id'];
            $type = $inputData['type'];
            $dateAujourdhui = date('Y-m-d');
            $heureActuelle = date('H:i');

            // Vérifier si un pointage existe déjà pour aujourd'hui
            $pointageExistant = $this->pointagePersonnelModel
                ->where('personnel_id', $personnelId)
                ->where('date_pointage', $dateAujourdhui)
                ->first();

            if ($pointageExistant) {
                // Mettre à jour le pointage existant
                $data = [];

                if ($type === 'arrivee') {
                    $data['heure_arrivee'] = $heureActuelle;
                    $data['statut'] = 'present';
                } else {
                    $data['heure_depart'] = $heureActuelle;

                    // Calculer les heures de travail si les deux heures sont présentes
                    if ($pointageExistant['heure_arrivee'] && $heureActuelle) {
                        $data['heures_travail'] = $this->calculerHeuresTravail(
                            $pointageExistant['heure_arrivee'],
                            $heureActuelle
                        );
                    }
                }

                $this->pointagePersonnelModel->update($pointageExistant['id'], $data);
                $message = $type === 'arrivee' ? 'Arrivée enregistrée' : 'Départ enregistré';
            } else {
                // Créer un nouveau pointage
                $data = [
                    'personnel_id' => $personnelId,
                    'date_pointage' => $dateAujourdhui,
                    'statut' => 'present',
                    'pointe_par' => 3
                ];

                if ($type === 'arrivee') {
                    $data['heure_arrivee'] = $heureActuelle;
                } else {
                    $data['heure_depart'] = $heureActuelle;
                    // Pour un départ sans arrivée, marquer comme absent ?
                    $data['statut'] = 'absent';
                }

                $this->pointagePersonnelModel->insert($data);
                $message = $type === 'arrivee' ? 'Arrivée enregistrée' : 'Départ enregistré (sans arrivée)';
            }

            return $this->respond([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::rapidePersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur lors du pointage rapide: ' . $e->getMessage());
        }
    }

    public function statsMensuellesPersonnel()
    {
        try {
            $mois = $this->request->getGet('mois');
            $personnelId = $this->request->getGet('personnel_id');

            if (!$mois) {
                return $this->fail('Le paramètre mois est requis');
            }

            $stats = $this->pointagePersonnelModel->getStatsMensuelles($mois, $personnelId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Pointages::statsMensuellesPersonnel: ' . $e->getMessage());
            return $this->failServerError('Erreur lors du calcul des statistiques: ' . $e->getMessage());
        }
    }

    private function calculerHeuresTravail($heureArrivee, $heureDepart)
    {
        $arrivee = strtotime($heureArrivee);
        $depart = strtotime($heureDepart);

        if ($arrivee === false || $depart === false) {
            return 0;
        }

        $diff = $depart - $arrivee;
        $heures = $diff / (60 * 60); // Convertir en heures

        return max(0, $heures);
    }
}
