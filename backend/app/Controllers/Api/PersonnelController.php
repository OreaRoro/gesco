<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\PersonnelModel;
use CodeIgniter\API\ResponseTrait;

class PersonnelController extends BaseController
{
    use ResponseTrait;


    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $personnelModel;

    public function __construct()
    {
        $this->personnelModel = new PersonnelModel();
    }

    public function index()
    {
        $filters = [
            'search' => $this->request->getGet('search'),
            'type_personnel' => $this->request->getGet('type_personnel'),
            'statut' => $this->request->getGet('statut')
        ];

        $personnel = $this->personnelModel->getFiltered($filters);

        return $this->respond([
            'success' => true,
            'data' => [
                'personnel' => $personnel
            ]
        ]);
    }

    public function all()
    {
        $personnel = $this->personnelModel->findAll();

        return $this->respond([
            'success' => true,
            'data' => [
                'personnel' => $personnel
            ]
        ]);
    }

    public function show($id)
    {
        $personnel = $this->personnelModel->find($id);

        if (!$personnel) {
            return $this->failNotFound('Membre du personnel non trouvé');
        }

        return $this->respond([
            'success' => true,
            'data' => [
                'personnel' => $personnel
            ]
        ]);
    }

    public function create()
    {
        $rules = [
            'nom' => 'required|max_length[100]',
            'prenom' => 'required|max_length[100]',
            'type_personnel' => 'required|in_list[enseignant,surveillant,administratif,menage,direction,autre]',
            'date_embauche' => 'required|valid_date',
            'salaire_base' => 'required|decimal',
            'statut' => 'required|in_list[actif,inactif,congé,licencie]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Générer le matricule
        $matricule = $this->generateMatricule();

        $data = [
            'matricule' => $matricule,
            'nom' => $this->request->getPost('nom'),
            'prenom' => $this->request->getPost('prenom'),
            'sexe' => $this->request->getPost('sexe') ?: null,
            'date_naissance' => $this->request->getPost('date_naissance') ?: null,
            'lieu_naissance' => $this->request->getPost('lieu_naissance') ?: null,
            'adresse' => $this->request->getPost('adresse') ?: null,
            'telephone' => $this->request->getPost('telephone') ?: null,
            'email' => $this->request->getPost('email') ?: null,
            'type_personnel' => $this->request->getPost('type_personnel'),
            'date_embauche' => $this->request->getPost('date_embauche'),
            'salaire_base' => $this->request->getPost('salaire_base'),
            'statut' => $this->request->getPost('statut'),
            'specialite' => $this->request->getPost('specialite'),
            'niveau_etude' => $this->request->getPost('niveau_etude'),
        ];

        // Gestion de la photo
        $photo = $this->request->getFile('photo');
        if ($photo && $photo->isValid() && !$photo->hasMoved()) {
            $newName = $photo->getRandomName();
            $photo->move(ROOTPATH . 'public/uploads/personnel', $newName);
            $data['photo'] = 'uploads/personnel/' . $newName;
        }

        try {
            $this->personnelModel->insert($data);
            $personnelId = $this->personnelModel->getInsertID();

            return $this->respondCreated([
                'success' => true,
                'message' => 'Membre du personnel créé avec succès',
                'data' => [
                    'id' => $personnelId
                ]
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la création: ' . $e->getMessage());
        }
    }

    public function update($id)
    {
        $personnel = $this->personnelModel->find($id);

        if (!$personnel) {
            return $this->failNotFound('Membre du personnel non trouvé');
        }

        $rules = [
            'nom' => 'required|max_length[100]',
            'prenom' => 'required|max_length[100]',
            'type_personnel' => 'required|in_list[enseignant,surveillant,administratif,menage,direction,autre]',
            'date_embauche' => 'required|valid_date',
            'salaire_base' => 'required|decimal',
            'statut' => 'required|in_list[actif,inactif,congé,licencie]'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = [
            'nom' => $this->request->getPost('nom'),
            'prenom' => $this->request->getPost('prenom'),
            'sexe' => $this->request->getPost('sexe') ?: null,
            'date_naissance' => $this->request->getPost('date_naissance') ?: null,
            'lieu_naissance' => $this->request->getPost('lieu_naissance') ?: null,
            'adresse' => $this->request->getPost('adresse') ?: null,
            'telephone' => $this->request->getPost('telephone') ?: null,
            'email' => $this->request->getPost('email') ?: null,
            'type_personnel' => $this->request->getPost('type_personnel'),
            'date_embauche' => $this->request->getPost('date_embauche'),
            'salaire_base' => $this->request->getPost('salaire_base'),
            'statut' => $this->request->getPost('statut'),
            'specialite' => $this->request->getPost('specialite'),
            'niveau_etude' => $this->request->getPost('niveau_etude'),
        ];

        // Gestion de la photo
        $photo = $this->request->getFile('photo');
        if ($photo && $photo->isValid() && !$photo->hasMoved()) {
            // Supprimer l'ancienne photo si elle existe
            if ($personnel['photo'] && file_exists(ROOTPATH . 'public/' . $personnel['photo'])) {
                unlink(ROOTPATH . 'public/' . $personnel['photo']);
            }

            $newName = $photo->getRandomName();
            $photo->move(ROOTPATH . 'public/uploads/personnel', $newName);
            $data['photo'] = 'uploads/personnel/' . $newName;
        }

        try {
            $this->personnelModel->update($id, $data);

            return $this->respond([
                'success' => true,
                'message' => 'Membre du personnel modifié avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la modification: ' . $e->getMessage());
        }
    }

    public function delete($id)
    {
        $personnel = $this->personnelModel->find($id);

        if (!$personnel) {
            return $this->failNotFound('Membre du personnel non trouvé');
        }

        try {
            // Supprimer la photo si elle existe
            if ($personnel['photo'] && file_exists(ROOTPATH . 'public/' . $personnel['photo'])) {
                unlink(ROOTPATH . 'public/' . $personnel['photo']);
            }

            $this->personnelModel->delete($id);

            return $this->respond([
                'success' => true,
                'message' => 'Membre du personnel supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la suppression: ' . $e->getMessage());
        }
    }

    private function generateMatricule()
    {
        $prefix = 'PERS';
        $year = date('Y');

        // Compter le nombre de personnel créé cette année
        $count = $this->personnelModel
            ->where('YEAR(created_at)', $year)
            ->countAllResults();

        $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);

        return $prefix . $year . $sequence;
    }

    /**
     * Récupère le personnel administratif
     */
    public function administratif()
    {
        try {
            $administratif = $this->personnelModel->getAdministratif();

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
}
