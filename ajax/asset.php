<?php
$glpiRoot = dirname(__DIR__, 3); // .../glpi
require_once $glpiRoot . '/inc/includes.php';

Session::checkLoginUser();


$f = $_GET['f'] ?? '';

$map = [
   'locassets.js' => __DIR__ . '/../js/locassets.js',
];

if (!isset($map[$f])) {
   http_response_code(404);
   header('Content-Type: text/plain; charset=UTF-8');
   echo 'Not found';
   exit;
}

$path = realpath($map[$f]);
if ($path === false || !is_file($path)) {
   http_response_code(404);
   header('Content-Type: text/plain; charset=UTF-8');
   echo 'Not found';
   exit;
}

header('Content-Type: application/javascript; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-cache, no-store, must-revalidate');
readfile($path);
