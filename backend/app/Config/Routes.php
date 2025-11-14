<?php

use CodeIgniter\Router\RouteCollection;
use App\Filters\JWTAuth;

/**
 * @var RouteCollection $routes
 */

// Routes publiques
$routes->group('api/auth', ['namespace' => 'App\Controllers\Api'], function ($routes) {
    $routes->post('register', 'AuthController::register');
    $routes->post('login', 'AuthController::login');
});

// Routes pour la gestion des élèves
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => JWTAuth::class], function ($routes) {
    // Auth
    $routes->get('auth/me', 'AuthController::me');
    $routes->post('auth/refresh', 'AuthController::refresh');

    // Élèves
    $routes->group('eleves', function ($routes) {
        $routes->get('/', 'ElevesController::index');
        $routes->get('statistiques', 'ElevesController::statistiques');
        $routes->get('(:num)', 'ElevesController::show/$1');
        $routes->get('inactifs', 'ElevesController::inactifs');
        $routes->get('(:num)/inscriptions', 'ElevesController::getInscriptions/$1');
        $routes->post('/', 'ElevesController::create');
        $routes->post('(:num)/reinscrire', 'ElevesController::reinscrire/$1');
        $routes->post('(:num)/restaurer', 'ElevesController::restore/$1');
        $routes->post('(:num)/inscrire', 'ElevesController::inscrire/$1');
        $routes->post('(:num)/photo', 'ElevesController::uploadPhoto/$1');
        $routes->put('(:num)', 'ElevesController::update/$1');
        $routes->patch('(:num)/desactiver', 'ElevesController::desactiver/$1');
        $routes->patch('(:num)/restaurer', 'ElevesController::restaurer/$1');
        $routes->delete('(:num)', 'ElevesController::delete/$1');
    });

    // Inscriptions
    $routes->group('inscriptions', function ($routes) {
        $routes->get('/', 'InscriptionsController::index');
        $routes->get('(:num)', 'InscriptionsController::show/$1');
        $routes->get('(:num)/paiements', 'PaiementsController::getByInscription/$1');
        $routes->get('(:num)/solde', 'PaiementsController::getSolde/$1');
        $routes->post('/', 'InscriptionsController::create');
        $routes->post('/reinscrire', 'InscriptionsController::reinscrire');
        $routes->put('(:num)', 'InscriptionsController::update/$1');
        $routes->delete('(:num)', 'InscriptionsController::delete/$1');
    });

    // Années scolaires
    $routes->group('annees-scolaires', function ($routes) {
        $routes->get('/', 'AnneesScolairesController::index');
        $routes->post('/', 'AnneesScolairesController::create');
        $routes->get('current', 'AnneesScolairesController::current');
        $routes->get('(:num)', 'AnneesScolairesController::show/$1');
        $routes->put('(:num)', 'AnneesScolairesController::update/$1');
        $routes->delete('(:num)', 'AnneesScolairesController::delete/$1');
        $routes->patch('(:num)/set-current', 'AnneesScolairesController::setCurrent/$1');
        $routes->patch('(:num)/set-active', 'AnneesScolairesController::setActive/$1');
        $routes->patch('(:num)/close', 'AnneesScolairesController::close/$1');
    });

    // Classes
    $routes->group('classes', function ($routes) {
        $routes->get('/', 'ClassesController::index');
        $routes->get('with-details', 'ClassesController::index');
        $routes->get('niveau/(:num)', 'ClassesController::byNiveau/$1');
        $routes->get('(:num)', 'ClassesController::show/$1');
        $routes->get('(:num)/effectif', 'ClassesController::effectif/$1');
        $routes->post('/', 'ClassesController::create');
        $routes->put('(:num)', 'ClassesController::update/$1');
        $routes->delete('(:num)', 'ClassesController::delete/$1');
    });

    // Niveaux
    $routes->group('niveaux', function ($routes) {
        $routes->get('/', 'NiveauxController::index');
        $routes->post('/', 'NiveauxController::create');
        $routes->put('(:num)', 'NiveauxController::update/$1');
        $routes->get('cycles', 'NiveauxController::cycles');
        $routes->get('cycle/(:any)', 'NiveauxController::byCycle/$1');
        $routes->get('(:num)', 'NiveauxController::show/$1');
        $routes->delete('(:num)', 'NiveauxController::delete/$1');
    });

    $routes->group('personnel', function ($routes) {
        $routes->get('/', 'PersonnelsController::index');
        $routes->get('/(:num)', 'PersonnelsController::show/$1');
        $routes->post('/', 'PersonnelsController::create');
        $routes->put('(:num)', 'PersonnelsController::update/$1');
        $routes->delete('(:num)', 'PersonnelsController::delete/$1');
        $routes->get('enseignants', 'PersonnelsController::enseignants');
        $routes->get('surveillants', 'PersonnelsController::surveillants');
        $routes->get('administratif', 'PersonnelsController::administratif');
        $routes->get('stats', 'PersonnelsController::stats');
        $routes->patch('(:num)/statut', 'PersonnelsController::updateStatut/$1');
        $routes->get('search', 'PersonnelsController::search');
        $routes->get('search/(:any)', 'PersonnelsController::search/$1');
    });

    $routes->group('frais-scolarite', function ($routes) {
        $routes->get('/', 'FraisScolariteController::index');
        $routes->get('niveau', 'FraisScolariteController::getByNiveau');
        $routes->get('classe/(:num)', 'FraisScolariteController::getByClasse/$1');
        $routes->post('/', 'FraisScolariteController::create');
        $routes->put('(:num)', 'FraisScolariteController::update/$1');
        $routes->delete('(:num)', 'FraisScolariteController::delete/$1');
    });

    $routes->group('paiements', function ($routes) {
        $routes->get('/', 'PaiementsController::index');
        $routes->get('/(:num)', 'PaiementsController::show/$1');
        $routes->get('statistiques', 'PaiementsController::statistiques');
        $routes->get('(:num)/quittance', 'PaiementsController::genererQuittance/$1');
        $routes->post('/', 'PaiementsController::create');
        $routes->put('(:num)', 'PaiementsController::update/$1');
        $routes->delete('(:num)', 'PaiementsController::delete/$1');
    });

    // Gestion des absences
    $routes->group('/', function ($routes) {
        $routes->get('eleves/(:num)/absences', 'AbsencesController::index/$1');
        $routes->post('eleves/(:num)/absences', 'AbsencesController::create/$1');
        $routes->get('eleves/(:num)/absences/statistiques', 'AbsencesController::statistiques/$1');
        $routes->put('absences/(:num)', 'AbsencesController::update/$1');
        $routes->delete('absences/(:num)', 'AbsencesController::delete/$1');
    });
});

$routes->get('uploads/*', 'Api\FilesController::serveSingle/$1');
$routes->get('uploads/eleves/(:any)', 'Api\FilesController::serveEleveImage/$1');
