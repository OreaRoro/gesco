<?php

namespace App\Controllers\Api;

use App\Models\NoteModel;
use App\Models\EleveModel;
use App\Models\InscriptionModel;
use App\Models\ExamenModel;
use App\Models\MatiereModel;
use App\Models\AnneeScolaireModel;
use App\Models\ClasseModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class NotesController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $noteModel;
    protected $eleveModel;
    protected $inscriptionModel;
    protected $examenModel;
    protected $matiereModel;
    protected $anneeScolaireModel;
    protected $classeModel;

    public function __construct()
    {
        $this->noteModel = new NoteModel();
        $this->eleveModel = new EleveModel();
        $this->inscriptionModel = new InscriptionModel();
        $this->examenModel = new ExamenModel();
        $this->matiereModel = new MatiereModel();
        $this->anneeScolaireModel = new AnneeScolaireModel();
        $this->classeModel = new ClasseModel();
    }

    /**
     * GET /api/eleves/{id}/notes
     * Récupère les notes d'un élève
     */
    public function getNotesEleve($eleveId = null)
    {
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');
        $examen_id = $this->request->getGet('examen_id');
        $matiere_id = $this->request->getGet('matiere_id');

        try {
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $notes = $this->noteModel->getNotesEleve($eleveId, $annee_scolaire_id, $examen_id, $matiere_id);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'notes' => $notes,
                    'eleve' => $eleve,
                    'filters' => [
                        'annee_scolaire_id' => $annee_scolaire_id,
                        'examen_id' => $examen_id,
                        'matiere_id' => $matiere_id
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des notes: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/{id}/moyennes
     * Récupère les moyennes d'un élève
     */
    public function getMoyennesEleve($eleveId = null)
    {
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $moyennes = $this->noteModel->getMoyennesEleve($eleveId, $annee_scolaire_id);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'moyennes' => $moyennes,
                    'eleve' => $eleve
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des moyennes: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/{id}/bulletin
     * Génère le bulletin d'un élève
     */
    public function getBulletin($eleveId = null)
    {
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            $eleve = $this->eleveModel->find($eleveId);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            if (!$annee_scolaire_id) {
                return $this->fail('Année scolaire requise');
            }

            // Récupérer l'inscription active
            $inscription = $this->inscriptionModel->where('eleve_id', $eleveId)
                ->where('annee_scolaire_id', $annee_scolaire_id)
                ->first();

            if (!$inscription) {
                return $this->failNotFound('Aucune inscription trouvée pour cet élève');
            }

            // Récupérer les notes et moyennes
            $notes = $this->noteModel->getNotesEleve($eleveId, $annee_scolaire_id);
            $moyennes = $this->noteModel->getMoyennesEleve($eleveId, $annee_scolaire_id);

            // Calculer la moyenne générale
            $moyenneGenerale = 0;
            $totalCoefficients = 0;

            foreach ($moyennes as $matiere) {
                $moyenneGenerale += $matiere['moyenne_ponderee'] * $matiere['coefficient'];
                $totalCoefficients += $matiere['coefficient'];
            }

            if ($totalCoefficients > 0) {
                $moyenneGenerale /= $totalCoefficients;
            }

            // Récupérer les informations de classe et année scolaire
            $classe = $this->classeModel->find($inscription['classe_id']);
            $anneeScolaire = $this->anneeScolaireModel->find($annee_scolaire_id);

            $bulletin = [
                'eleve' => $eleve,
                'classe' => $classe,
                'annee_scolaire' => $anneeScolaire,
                'inscription' => $inscription,
                'notes' => $notes,
                'moyennes_par_matiere' => $moyennes,
                'moyenne_generale' => round($moyenneGenerale, 2),
                'total_coefficients' => $totalCoefficients,
                'appreciation_generale' => $this->genererAppreciation($moyenneGenerale)
            ];

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'bulletin' => $bulletin
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la génération du bulletin: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/classes/{classeId}/notes
     * Récupère les notes d'une classe
     */
    public function getNotesClasse($classeId = null)
    {
        $examen_id = $this->request->getGet('examen_id');
        $matiere_id = $this->request->getGet('matiere_id');
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            $classe = $this->classeModel->find($classeId);
            if (!$classe) {
                return $this->failNotFound('Classe non trouvée');
            }

            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $notes = $this->noteModel->getNotesClasse($classeId, $annee_scolaire_id, $examen_id, $matiere_id);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'notes' => $notes,
                    'classe' => $classe,
                    'filters' => [
                        'examen_id' => $examen_id,
                        'matiere_id' => $matiere_id,
                        'annee_scolaire_id' => $annee_scolaire_id
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des notes de la classe: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/notes
     * Créer une nouvelle note
     */
    public function create()
    {
        $rules = [
            'eleve_id' => 'required|integer',
            'inscription_id' => 'required|integer',
            'matiere_id' => 'required|integer',
            'examen_id' => 'required|integer',
            'note' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[20]',
            'coefficient' => 'required|integer|greater_than[0]',
            'appreciation' => 'permit_empty|max_length[500]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Vérifier que l'élève existe
        $eleve = $this->eleveModel->find($this->request->getJsonVar('eleve_id'));
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier que l'inscription existe
        $inscription = $this->inscriptionModel->find($this->request->getJsonVar('inscription_id'));
        if (!$inscription) {
            return $this->failNotFound('Inscription non trouvée');
        }

        // Vérifier que la matière existe
        $matiere = $this->matiereModel->find($this->request->getJsonVar('matiere_id'));
        if (!$matiere) {
            return $this->failNotFound('Matière non trouvée');
        }

        // Vérifier que l'examen existe
        $examen = $this->examenModel->find($this->request->getJsonVar('examen_id'));
        if (!$examen) {
            return $this->failNotFound('Examen non trouvé');
        }

        $data = [
            'eleve_id' => $this->request->getJsonVar('eleve_id'),
            'inscription_id' => $this->request->getJsonVar('inscription_id'),
            'matiere_id' => $this->request->getJsonVar('matiere_id'),
            'examen_id' => $this->request->getJsonVar('examen_id'),
            'note' => $this->request->getJsonVar('note'),
            'coefficient' => $this->request->getJsonVar('coefficient'),
            'appreciation' => $this->request->getJsonVar('appreciation'),
            'saisie_par' => $this->request->getJsonVar('saisie_par') // À remplir avec l'ID de l'utilisateur connecté
        ];

        try {
            if (!$this->noteModel->insert($data)) {
                return $this->failValidationErrors($this->noteModel->errors());
            }

            $noteId = $this->noteModel->getInsertID();
            $note = $this->noteModel->find($noteId);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Note créée avec succès',
                'data' => [
                    'note' => $note
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la création de la note: ' . $e->getMessage());
        }
    }

    /**
     * PUT /api/notes/{id}
     * Met à jour une note
     */
    public function update($id = null)
    {
        // Vérifier si la note existe
        $note = $this->noteModel->find($id);
        if (!$note) {
            return $this->failNotFound('Note non trouvée');
        }

        $rules = [
            'note' => 'required|decimal|greater_than_equal_to[0]|less_than_equal_to[20]',
            'coefficient' => 'required|integer|greater_than[0]',
            'appreciation' => 'permit_empty|max_length[500]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = [
            'note' => $this->request->getJsonVar('note'),
            'coefficient' => $this->request->getJsonVar('coefficient'),
            'appreciation' => $this->request->getJsonVar('appreciation')
        ];

        try {
            if (!$this->noteModel->update($id, $data)) {
                return $this->failValidationErrors($this->noteModel->errors());
            }

            $note = $this->noteModel->find($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Note modifiée avec succès',
                'data' => [
                    'note' => $note
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la mise à jour de la note: ' . $e->getMessage());
        }
    }

    /**
     * DELETE /api/notes/{id}
     * Supprime une note
     */
    public function delete($id = null)
    {
        // Vérifier si la note existe
        $note = $this->noteModel->find($id);
        if (!$note) {
            return $this->failNotFound('Note non trouvée');
        }

        try {
            if (!$this->noteModel->delete($id)) {
                return $this->fail('Erreur lors de la suppression');
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Note supprimée avec succès',
                'data' => [
                    'note_id' => $id
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la suppression de la note: ' . $e->getMessage());
        }
    }

    /**
     * Génère une appréciation basée sur la moyenne
     */
    private function genererAppreciation($moyenne)
    {
        if ($moyenne >= 16) {
            return 'Excellent - Félicitations';
        } elseif ($moyenne >= 14) {
            return 'Très bon travail';
        } elseif ($moyenne >= 12) {
            return 'Bon travail';
        } elseif ($moyenne >= 10) {
            return 'Satisfaisant';
        } elseif ($moyenne >= 8) {
            return 'Insuffisant - Doit faire des efforts';
        } else {
            return 'Très insuffisant - Travail à reprendre';
        }
    }
}
