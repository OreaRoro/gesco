<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\PersonnelModel;
use App\Models\EnseignantMatiereModel;
use App\Models\MatiereModel;
use App\Models\ClasseModel;
use CodeIgniter\API\ResponseTrait;

class EnseignantsController extends BaseController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $personnelModel;
    protected $enseignantMatiereModel;
    protected $matiereModel;
    protected $classeModel;

    public function __construct()
    {
        $this->personnelModel = new PersonnelModel();
        $this->enseignantMatiereModel = new EnseignantMatiereModel();
        $this->matiereModel = new MatiereModel();
        $this->classeModel = new ClasseModel();
    }

    // Récupérer les matières enseignées par un enseignant
    public function matieres($enseignantId = null)
    {
        try {
            if (!$enseignantId) {
                return $this->failNotFound('ID enseignant non fourni');
            }

            // Vérifier que l'enseignant existe et est bien un enseignant
            $enseignant = $this->personnelModel->find($enseignantId);
            if (!$enseignant || $enseignant['type_personnel'] !== 'enseignant') {
                return $this->failNotFound('Enseignant non trouvé');
            }

            $matieresEnseignees = $this->enseignantMatiereModel->getByEnseignant($enseignantId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'matieres' => $matieresEnseignees
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::matieres: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    // Assigner une matière à un enseignant
    public function assignerMatiere($enseignantId = null)
    {
        try {
            if (!$enseignantId) {
                return $this->failNotFound('ID enseignant non fourni');
            }

            // Récupérer les données JSON
            $json = $this->request->getJSON(true);
            $inputData = $json ?: $this->request->getPost();

            log_message('info', 'Assignation matière: ' . print_r($inputData, true));

            $rules = [
                'matiere_id' => 'required|integer',
                'classe_id' => 'required|integer',
                'annee_scolaire_id' => 'required|integer',
                'heures_semaine' => 'required|integer|greater_than[0]'
            ];

            if (!$this->validate($rules)) {
                return $this->failValidationErrors($this->validator->getErrors());
            }

            // Vérifier que l'enseignant existe
            $enseignant = $this->personnelModel->find($enseignantId);
            if (!$enseignant || $enseignant['type_personnel'] !== 'enseignant') {
                return $this->failNotFound('Enseignant non trouvé');
            }

            // Vérifier que la matière existe
            $matiere = $this->matiereModel->find($inputData['matiere_id']);
            if (!$matiere) {
                return $this->failNotFound('Matière non trouvée');
            }

            // Vérifier que la classe existe
            $classe = $this->classeModel->find($inputData['classe_id']);
            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            // Vérifier si l'assignation existe déjà
            $existing = $this->enseignantMatiereModel
                ->where('enseignant_id', $enseignantId)
                ->where('matiere_id', $inputData['matiere_id'])
                ->where('classe_id', $inputData['classe_id'])
                ->where('annee_scolaire_id', $inputData['annee_scolaire_id'])
                ->first();

            if ($existing) {
                return $this->fail('Cette matière est déjà assignée à cet enseignant pour cette classe et année scolaire');
            }

            $data = [
                'enseignant_id' => $enseignantId,
                'matiere_id' => $inputData['matiere_id'],
                'classe_id' => $inputData['classe_id'],
                'annee_scolaire_id' => $inputData['annee_scolaire_id'],
                'heures_semaine' => $inputData['heures_semaine']
            ];

            $this->enseignantMatiereModel->insert($data);
            $assignmentId = $this->enseignantMatiereModel->getInsertID();

            return $this->respondCreated([
                'success' => true,
                'message' => 'Matière assignée avec succès',
                'data' => [
                    'id' => $assignmentId
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::assignerMatiere: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de l\'assignation: ' . $e->getMessage());
        }
    }

    // Retirer une matière assignée
    public function retirerMatiere($assignmentId = null)
    {
        try {
            if (!$assignmentId) {
                return $this->failNotFound('ID assignation non fourni');
            }

            $assignment = $this->enseignantMatiereModel->find($assignmentId);
            if (!$assignment) {
                return $this->failNotFound('Assignation non trouvée');
            }

            $this->enseignantMatiereModel->delete($assignmentId);

            return $this->respond([
                'success' => true,
                'message' => 'Matière retirée avec succès'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::retirerMatiere: ' . $e->getMessage());
            return $this->failServerError('Erreur lors du retrait: ' . $e->getMessage());
        }
    }

    // Emploi du temps de l'enseignant
    public function emploiDuTemps($enseignantId = null)
    {
        try {
            if (!$enseignantId) {
                return $this->failNotFound('ID enseignant non fourni');
            }

            $anneeScolaireId = $this->request->getGet('annee_scolaire_id');

            // Vérifier que l'enseignant existe
            $enseignant = $this->personnelModel->find($enseignantId);
            if (!$enseignant || $enseignant['type_personnel'] !== 'enseignant') {
                return $this->failNotFound('Enseignant non trouvé');
            }

            $emploiDuTemps = $this->enseignantMatiereModel->getEmploiDuTemps($enseignantId, $anneeScolaireId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'emploi_du_temps' => $emploiDuTemps,
                    'enseignant' => [
                        'id' => $enseignant['id'],
                        'nom' => $enseignant['nom'],
                        'prenom' => $enseignant['prenom'],
                        'matricule' => $enseignant['matricule']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::emploiDuTemps: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    // Statistiques de l'enseignant
    public function stats($enseignantId = null)
    {
        try {
            if (!$enseignantId) {
                return $this->failNotFound('ID enseignant non fourni');
            }

            // Vérifier que l'enseignant existe
            $enseignant = $this->personnelModel->find($enseignantId);
            if (!$enseignant || $enseignant['type_personnel'] !== 'enseignant') {
                return $this->failNotFound('Enseignant non trouvé');
            }

            $stats = $this->enseignantMatiereModel->getStats($enseignantId);

            return $this->respond([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'enseignant' => [
                        'id' => $enseignant['id'],
                        'nom' => $enseignant['nom'],
                        'prenom' => $enseignant['prenom'],
                        'specialite' => $enseignant['specialite'] ?? 'Non spécifiée'
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::stats: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }

    // Liste des enseignants avec filtres
    public function index()
    {
        try {
            $filters = [
                'search' => $this->request->getGet('search'),
                'specialite' => $this->request->getGet('specialite'),
                'statut' => $this->request->getGet('statut')
            ];

            // Filtrer uniquement les enseignants
            $filters['type_personnel'] = 'enseignant';

            // Nettoyer les filtres vides
            $filters = array_filter($filters, function ($value) {
                return $value !== null && $value !== '';
            });

            log_message('info', 'Filtres enseignants: ' . print_r($filters, true));

            $enseignants = $this->personnelModel->getFiltered($filters);

            return $this->respond([
                'success' => true,
                'data' => [
                    'enseignants' => $enseignants
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur dans Enseignants::index: ' . $e->getMessage());
            return $this->failServerError('Erreur serveur: ' . $e->getMessage());
        }
    }
}
