<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Config\JWT as JWTConfig;

if (!function_exists('generate_jwt_token')) {
    function generate_jwt_token($user_id, $username, $role)
    {
        $jwtConfig = new JWTConfig();

        $payload = [
            'iss' => base_url(),
            'aud' => base_url(),
            'iat' => time(),
            'exp' => time() + $jwtConfig->expiration,
            'data' => [
                'user_id' => $user_id,
                'username' => $username,
                'role' => $role
            ]
        ];

        return JWT::encode($payload, $jwtConfig->key, $jwtConfig->algorithm);
    }
}

if (!function_exists('verify_jwt_token')) {
    function verify_jwt_token($token)
    {
        try {
            $jwtConfig = new JWTConfig();
            $decoded = JWT::decode($token, new Key($jwtConfig->key, $jwtConfig->algorithm));
            return (array) $decoded->data;
        } catch (Exception $e) {
            log_message('error', 'JWT Verification failed: ' . $e->getMessage());
            return null;
        }
    }
}

if (!function_exists('get_jwt_from_header')) {
    function get_jwt_from_header()
    {
        $request = service('request');
        $authHeader = $request->getHeader('Authorization');

        if ($authHeader) {
            $authHeader = $authHeader->getValue();
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }
}
