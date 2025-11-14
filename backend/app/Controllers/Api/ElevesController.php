<?php

namespace App\Controllers\Api;

use App\Models\EleveModel;
use App\Models\InscriptionModel;
use App\Models\ClasseModel;
use App\Models\AnneeScolaireModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class ElevesController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $eleveModel;
    protected $inscriptionModel;
    protected $classeModel;
    protected $anneeScolaireModel;

    public function __construct()
    {
        $this->eleveModel = new EleveModel();
        $this->inscriptionModel = new InscriptionModel();
        $this->classeModel = new ClasseModel();
        $this->anneeScolaireModel = new AnneeScolaireModel();
    }

    /**
     * GET /api/eleves
     * Liste tous les élèves avec pagination, recherche et filtre par année scolaire
     */
    public function index()
    {
        $page = $this->request->getGet('page') ?? 1;
        $perPage = $this->request->getGet('perPage') ?? 5;
        $search = $this->request->getGet('search') ?? '';
        $statut = $this->request->getGet('statut') ?? '';
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $eleves = $this->eleveModel->getAllEleves($page, $perPage, $search, $statut, $annee_scolaire_id);
            $pager = $this->eleveModel->pager;

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'eleves' => $eleves,
                    'filters' => [
                        'annee_scolaire_id' => $annee_scolaire_id,
                        'search' => $search,
                        'statut' => $statut
                    ],
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => $pager->getTotal(),
                        'total_pages' => $pager->getPageCount()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des élèves: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/{id}
     * Récupère un élève spécifique avec ses inscriptions
     */
    public function show($id = null)
    {
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            $eleve = $this->eleveModel->find($id);

            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            // Récupérer les inscriptions de l'élève (optionnellement filtrées par année scolaire)
            $inscriptions = $this->inscriptionModel->getInscriptionsByEleve($id, $annee_scolaire_id);

            // Vérifier si l'élève a une inscription active pour l'année spécifiée
            $hasActiveInscription = false;
            $currentInscription = null;

            if ($annee_scolaire_id) {
                $hasActiveInscription = $this->eleveModel->hasActiveInscription($id, $annee_scolaire_id);
                $currentInscription = $this->eleveModel->getActiveInscription($id, $annee_scolaire_id);
            }

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'eleve' => $eleve,
                    'inscriptions' => $inscriptions,
                    'has_active_inscription' => $hasActiveInscription,
                    'current_inscription' => $currentInscription
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération de l\'élève: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/eleves/{id}/reinscrire
     * Réinscrire un élève pour l'année scolaire courante
     */
    public function reinscrire($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        $rules = [
            'annee_scolaire_id' => 'required|integer',
            'date_inscription' => 'required|valid_date',
            'classe_id' => 'required|integer'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $anneeScolaireId = $this->request->getJsonVar('annee_scolaire_id');
        $classeId = $this->request->getJsonVar('classe_id');

        // Vérifier que l'élève n'a pas déjà une inscription active pour cette année
        if ($this->eleveModel->hasActiveInscription($id, $anneeScolaireId)) {
            return $this->fail('L\'élève a déjà une inscription active pour cette année scolaire.', 400);
        }

        // Vérifier que la classe existe et a de la place
        $classe = $this->classeModel->find($classeId);
        if (!$classe) {
            return $this->failNotFound('Classe non trouvée');
        }

        if (!$this->classeModel->hasAvailableSpace($classeId)) {
            return $this->fail('La classe a atteint sa capacité maximale', 400);
        }

        $data = [
            'eleve_id' => $id,
            'classe_id' => $classeId,
            'annee_scolaire_id' => $anneeScolaireId,
            'date_inscription' => $this->request->getJsonVar('date_inscription'),
            'montant_inscription' => $this->request->getJsonVar('montant_inscription') ?? 0,
            'montant_paye' => $this->request->getJsonVar('montant_paye') ?? 0,
            'statut' => 'inscrit'
        ];

        try {
            $inscriptionId = $this->inscriptionModel->inscrireEleve($data);

            // Mettre à jour le statut de l'élève si nécessaire
            if ($eleve['statut'] === 'inactif') {
                $this->eleveModel->update($id, ['statut' => 'actif']);
            }

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Élève réinscrit avec succès',
                'data' => [
                    'inscription_id' => $inscriptionId
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/eleves/{id}/can-reinscrire
     * Vérifie si un élève peut être réinscrit
     */
    public function canReinscrire($id = null)
    {
        $annee_scolaire_id = $this->request->getGet('annee_scolaire_id');

        try {
            $eleve = $this->eleveModel->find($id);
            if (!$eleve) {
                return $this->failNotFound('Élève non trouvé');
            }

            // Si aucune année scolaire n'est spécifiée, utiliser l'année courante
            if (!$annee_scolaire_id) {
                $anneeCourante = $this->anneeScolaireModel->where('statut', 'courante')->first();
                $annee_scolaire_id = $anneeCourante ? $anneeCourante['id'] : null;
            }

            $canReinscrire = true;
            $message = '';

            // Vérifications
            if ($this->eleveModel->hasActiveInscription($id, $annee_scolaire_id)) {
                $canReinscrire = false;
                $message = 'L\'élève a déjà une inscription active pour cette année scolaire';
            } elseif ($eleve['statut'] === 'transfere') {
                $canReinscrire = false;
                $message = 'Un élève transféré ne peut pas être réinscrit';
            } elseif ($eleve['statut'] === 'diplome') {
                $canReinscrire = false;
                $message = 'Un élève diplômé ne peut pas être réinscrit';
            }

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'can_reinscrire' => $canReinscrire,
                    'message' => $message
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la vérification: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/eleves
     * Créer un nouvel élève
     */
    public function create()
    {
        $rules = [
            'nom' => 'required|min_length[2]|max_length[100]',
            'prenom' => 'required|min_length[2]|max_length[100]',
            'date_naissance' => 'valid_date',
            'lieu_naissance' => 'permit_empty|max_length[100]',
            'sexe' => 'required|in_list[M,F]',
            'adresse' => 'permit_empty',
            'telephone_parent' => 'permit_empty|max_length[20]',
            'email_parent' => 'permit_empty|valid_email',
            'date_inscription' => 'required|valid_date'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Génération du matricule
        $matricule = $this->eleveModel->genererMatricule();

        $data = [
            'matricule' => $matricule,
            'nom' => $this->request->getJsonVar('nom'),
            'prenom' => $this->request->getJsonVar('prenom'),
            'date_naissance' => $this->request->getJsonVar('date_naissance'),
            'lieu_naissance' => $this->request->getJsonVar('lieu_naissance'),
            'sexe' => $this->request->getJsonVar('sexe'),
            'adresse' => $this->request->getJsonVar('adresse'),
            'telephone_parent' => $this->request->getJsonVar('telephone_parent'),
            'email_parent' => $this->request->getJsonVar('email_parent'),
            'date_inscription' => $this->request->getJsonVar('date_inscription'),
            'statut' => 'actif'
        ];

        try {
            if (!$this->eleveModel->insert($data)) {
                return $this->failValidationErrors($this->eleveModel->errors());
            }

            $eleveId = $this->eleveModel->getInsertID();
            $eleve = $this->eleveModel->find($eleveId);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Élève créé avec succès',
                'data' => [
                    'eleve' => $eleve
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la création de l\'élève: ' . $e->getMessage());
        }
    }



    /**
     * PUT /api/eleves/{id}
     * Met à jour un élève
     */
    public function update($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        $rules = [
            'nom' => 'required|min_length[2]|max_length[100]',
            'prenom' => 'required|min_length[2]|max_length[100]',
            'date_naissance' => 'valid_date',
            'lieu_naissance' => 'permit_empty|max_length[100]',
            'sexe' => 'required|in_list[M,F]',
            'adresse' => 'permit_empty',
            'telephone_parent' => 'permit_empty|max_length[20]',
            'email_parent' => 'permit_empty|valid_email',
            'statut' => 'required|in_list[actif,inactif,transfere,diplome]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = [
            'nom' => $this->request->getJsonVar('nom'),
            'prenom' => $this->request->getJsonVar('prenom'),
            'date_naissance' => $this->request->getJsonVar('date_naissance'),
            'lieu_naissance' => $this->request->getJsonVar('lieu_naissance'),
            'sexe' => $this->request->getJsonVar('sexe'),
            'adresse' => $this->request->getJsonVar('adresse'),
            'telephone_parent' => $this->request->getJsonVar('telephone_parent'),
            'email_parent' => $this->request->getJsonVar('email_parent'),
            'statut' => $this->request->getJsonVar('statut')
        ];

        try {
            if (!$this->eleveModel->update($id, $data)) {
                return $this->failValidationErrors($this->eleveModel->errors());
            }

            $eleve = $this->eleveModel->find($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Élève mis à jour avec succès',
                'data' => [
                    'eleve' => $eleve
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la mise à jour de l\'élève: ' . $e->getMessage());
        }
    }
    /**
     * DELETE /api/eleves/{id}
     * "Supprime" un élève en le marquant comme inactif
     */
    public function delete($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier si l'élève est déjà inactif
        if ($eleve['statut'] === 'inactif') {
            return $this->fail('Cet élève est déjà désactivé.', 400);
        }

        try {
            // Soft delete - on change juste le statut
            $this->eleveModel->softDelete($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Élève désactivé avec succès',
                'data' => [
                    'eleve_id' => $id,
                    'nouveau_statut' => 'inactif'
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la désactivation de l\'élève: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/eleves/{id}/restore
     * Restaure un élève précédemment désactivé
     */
    public function restore($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier si l'élève est déjà actif
        if ($eleve['statut'] === 'actif') {
            return $this->fail('Cet élève est déjà actif.', 400);
        }

        try {
            // Restaurer l'élève
            $this->eleveModel->restore($id);

            return $this->respond([
                'status' => 'success',
                'message' => 'Élève restauré avec succès',
                'data' => [
                    'eleve_id' => $id,
                    'nouveau_statut' => 'actif'
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la restauration de l\'élève: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/eleves/inactifs
     * Liste les élèves inactifs (désactivés)
     */
    public function inactifs()
    {
        $page = $this->request->getGet('page') ?? 1;
        $perPage = $this->request->getGet('perPage') ?? 10;
        $search = $this->request->getGet('search') ?? '';

        try {
            $eleves = $this->eleveModel->where('statut', 'inactif')
                ->groupStart()
                ->like('nom', $search)
                ->orLike('prenom', $search)
                ->orLike('matricule', $search)
                ->groupEnd()
                ->orderBy('nom', 'ASC')
                ->orderBy('prenom', 'ASC')
                ->paginate($perPage, 'default', $page);

            $pager = $this->eleveModel->pager;

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'eleves' => $eleves,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => $pager->getTotal(),
                        'total_pages' => $pager->getPageCount()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des élèves inactifs: ' . $e->getMessage());
        }
    }

    // Dans ElevesController.php - Ajouter ces méthodes

    /**
     * PATCH /api/eleves/{id}/desactiver
     * Désactive un élève (soft delete)
     */
    public function desactiver($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier si l'élève est déjà inactif
        if ($eleve['statut'] === 'inactif') {
            return $this->fail('Cet élève est déjà désactivé.', 400);
        }

        try {
            // Soft delete - on change juste le statut
            $this->eleveModel->update($id, [
                'statut' => 'inactif',
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            return $this->respond([
                'status' => 'success',
                'message' => 'Élève désactivé avec succès',
                'data' => [
                    'eleve_id' => $id,
                    'nouveau_statut' => 'inactif'
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la désactivation de l\'élève: ' . $e->getMessage());
        }
    }

    /**
     * PATCH /api/eleves/{id}/restaurer
     * Restaure un élève précédemment désactivé
     */
    public function restaurer($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        // Vérifier si l'élève est déjà actif
        if ($eleve['statut'] === 'actif') {
            return $this->fail('Cet élève est déjà actif.', 400);
        }

        try {
            // Restaurer l'élève
            $this->eleveModel->update($id, [
                'statut' => 'actif',
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            return $this->respond([
                'status' => 'success',
                'message' => 'Élève restauré avec succès',
                'data' => [
                    'eleve_id' => $id,
                    'nouveau_statut' => 'actif'
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la restauration de l\'élève: ' . $e->getMessage());
        }
    }



    /**
     * GET /api/eleves/statistiques
     * Récupère les statistiques des élèves
     */
    public function statistiques()
    {
        try {
            $stats = $this->eleveModel->getStatistiques();

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'statistiques' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des statistiques: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/eleves/{id}/photo
     * Upload une photo pour un élève
     */
    public function uploadPhoto($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        $file = $this->request->getFile('photo');

        if (!$file || !$file->isValid()) {
            return $this->failValidationErrors('Fichier photo invalide');
        }

        // Validation du type de fichier
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return $this->fail('Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF');
        }

        // Validation de la taille (max 2MB)
        if ($file->getSize() > 2097152) {
            return $this->fail('La taille du fichier ne doit pas dépasser 2MB');
        }

        if (!$file->hasMoved()) {
            $newName = $file->getRandomName();
            $uploadPath = WRITEPATH . 'uploads/eleves/';

            // Créer le dossier s'il n'existe pas
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }

            // Déplacer le fichier
            $file->move($uploadPath, $newName);

            // Mettre à jour la photo de l'élève
            $photoPath = 'uploads/eleves/' . $newName;
            $this->eleveModel->update($id, ['photo' => $photoPath]);

            return $this->respond([
                'status' => 'success',
                'message' => 'Photo uploadée avec succès',
                'data' => [
                    'photo_url' => base_url($photoPath)
                ]
            ]);
        }

        return $this->fail('Erreur lors de l\'upload de la photo');
    }

    /**
     * GET /api/eleves/{id}/inscriptions
     * Récupère les inscriptions d'un élève
     */
    public function getInscriptions($id = null)
    {
        try {
            $inscriptions = $this->inscriptionModel->getInscriptionsByEleve($id);

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'inscriptions' => $inscriptions
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des inscriptions: ' . $e->getMessage());
        }
    }

    /**
     * POST /api/eleves/{id}/inscrire
     * Inscrire un élève dans une classe
     */
    public function inscrire($id = null)
    {
        // Vérifier si l'élève existe
        $eleve = $this->eleveModel->find($id);
        if (!$eleve) {
            return $this->failNotFound('Élève non trouvé');
        }

        $rules = [
            'classe_id' => 'required|integer',
            'annee_scolaire_id' => 'required|integer',
            'date_inscription' => 'required|valid_date',
            'montant_inscription' => 'required|decimal'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Vérifier que la classe existe
        $classe = $this->classeModel->find($this->request->getJsonVar('classe_id'));
        if (!$classe) {
            return $this->failNotFound('Classe non trouvée');
        }

        // Vérifier que l'année scolaire existe
        $anneeScolaire = $this->anneeScolaireModel->find($this->request->getJsonVar('annee_scolaire_id'));
        if (!$anneeScolaire) {
            return $this->failNotFound('Année scolaire non trouvée');
        }

        // Vérifier si la classe a de la place
        if (!$this->classeModel->hasAvailableSpace($classe['id'])) {
            return $this->fail('La classe a atteint sa capacité maximale', 400);
        }

        $data = [
            'eleve_id' => $id,
            'classe_id' => $this->request->getJsonVar('classe_id'),
            'annee_scolaire_id' => $this->request->getJsonVar('annee_scolaire_id'),
            'date_inscription' => $this->request->getJsonVar('date_inscription'),
            'montant_inscription' => $this->request->getJsonVar('montant_inscription'),
            'montant_paye' => $this->request->getJsonVar('montant_paye') ?? 0,
            'statut' => 'inscrit'
        ];

        try {
            $inscriptionId = $this->inscriptionModel->inscrireEleve($data);

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Élève inscrit avec succès',
                'data' => [
                    'inscription_id' => $inscriptionId
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage(), 400);
        }
    }
}
