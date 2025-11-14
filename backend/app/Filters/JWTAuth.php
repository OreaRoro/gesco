<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class JWTAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        helper('jwt');
        $token = get_jwt_from_header();

        if (!$token) {
            return service('response')->setJSON([
                'status' => 'error',
                'message' => 'Token d\'authentification manquant'
            ])->setStatusCode(401);
        }

        $decoded = verify_jwt_token($token);

        if (!$decoded) {
            return service('response')->setJSON([
                'status' => 'error',
                'message' => 'Token d\'authentification invalide ou expiré'
            ])->setStatusCode(401);
        }

        // Stocker les données de l'utilisateur dans la requête
        $request->user = $decoded;

        return $request;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Pas d'action après la requête
    }
}
