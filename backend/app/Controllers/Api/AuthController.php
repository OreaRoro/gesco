<?php

namespace App\Controllers\Api;

use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\HTTP\IncomingRequest
     */
    protected $request;
    protected $userModel;
    protected $validation;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->validation = \Config\Services::validation();
        helper('jwt');
    }

    public function login()
    {
        $request = $this->request->getJSON(true);


        // Validation des données
        $rules = [
            'identifier' => 'required',
            'password' => 'required'
        ];

        $messages = [
            'identifier' => [
                'required' => 'Le nom d\'utilisateur ou l\'email est requis'
            ],
            'password' => [
                'required' => 'Le mot de passe est requis'
            ]
        ];

        if (!$this->validate($rules, $messages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $identifier = trim($request['identifier']);
        $password = trim($request['password']);

        // Recherche de l'utilisateur par username ou email
        $user = $this->userModel->getUserByIdentifier($identifier);

        if (!$user) {
            return $this->failUnauthorized('Identifiant ou mot de passe incorrect');
        }

        if (!$this->userModel->verifyPassword($password, $user['password'])) {
            return $this->failUnauthorized('Identifiant ou mot de passe incorrect');
        }

        // Mise à jour de la dernière connexion
        $this->userModel->update($user['id'], ['last_login' => date('Y-m-d H:i:s')]);

        // Génération du token JWT
        $token = generate_jwt_token($user['id'], $user['username'], $user['role']);

        // Réponse
        return $this->respond([
            'status' => 'success',
            'message' => 'Connexion réussie',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'nom' => $user['nom'],
                    'prenom' => $user['prenom'],
                    'type_personnel' => $user['type_personnel']
                ]
            ]
        ]);
    }

    public function register()
    {
        // Vérifier que l'utilisateur est admin pour créer des comptes
        $token = get_jwt_from_header();
        $decoded = verify_jwt_token($token);

        if (!$decoded || $decoded['role'] !== 'admin') {
            return $this->failUnauthorized('Seul un administrateur peut créer des comptes');
        }

        $request = $this->request->getJSON(true);

        // Validation des données
        $rules = [
            'username' => 'required|min_length[3]|max_length[50]|is_unique[users.username]',
            'password' => 'required|min_length[6]',
            'email' => 'required|valid_email|is_unique[users.email]',
            'role' => 'required|in_list[admin,secretaire,enseignant,surveillant]',
            'personnel_id' => 'required|integer'
        ];

        if (!$this->validate($rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            // Vérifier que le personnel existe
            $personnelModel = new \App\Models\PersonnelModel();
            $personnel = $personnelModel->find($request['personnel_id']);

            if (!$personnel) {
                return $this->failNotFound('Personnel non trouvé');
            }

            // Création de l'utilisateur
            $userData = [
                'username' => $request['username'],
                'password' => $request['password'],
                'email' => $request['email'],
                'role' => $request['role'],
                'personnel_id' => $request['personnel_id'],
                'is_active' => 1
            ];

            $this->userModel->insert($userData);
            $userId = $this->userModel->getInsertID();

            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Utilisateur créé avec succès',
                'data' => [
                    'user_id' => $userId
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Erreur création utilisateur: ' . $e->getMessage());
            return $this->failServerError('Erreur lors de la création de l\'utilisateur');
        }
    }

    public function me()
    {
        $token = get_jwt_from_header();

        if (!$token) {
            return $this->failUnauthorized('Token manquant');
        }

        $decoded = verify_jwt_token($token);

        if (!$decoded) {
            return $this->failUnauthorized('Token invalide');
        }

        $user = $this->userModel->getUserByUsername($decoded['username']);

        if (!$user) {
            return $this->failNotFound('Utilisateur non trouvé');
        }

        return $this->respond([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'nom' => $user['nom'],
                    'prenom' => $user['prenom'],
                    'type_personnel' => $user['type_personnel']
                ]
            ]
        ]);
    }

    public function refresh()
    {
        $token = get_jwt_from_header();

        if (!$token) {
            return $this->failUnauthorized('Token manquant');
        }

        $decoded = verify_jwt_token($token);

        if (!$decoded) {
            return $this->failUnauthorized('Token invalide');
        }

        // Générer un nouveau token
        $newToken = generate_jwt_token($decoded['user_id'], $decoded['username'], $decoded['role']);

        return $this->respond([
            'status' => 'success',
            'message' => 'Token rafraîchi',
            'data' => [
                'token' => $newToken
            ]
        ]);
    }
}
