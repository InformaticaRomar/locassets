<?php
$glpiRoot = dirname(__DIR__, 3); // .../glpi
require_once $glpiRoot . '/inc/includes.php';

header('Content-Type: application/json; charset=UTF-8');

Session::checkLoginUser();

global $DB;

$locId   = (int)($_GET['locations_id'] ?? 0);
$q       = trim((string)($_GET['q'] ?? ''));
$reqType = trim((string)($_GET['itemtype'] ?? ''));

// Select2 pagination (page starts at 1)
$page    = (int)($_GET['page'] ?? 1);
$page    = max(1, $page);
$perPage = 30;
$start   = ($page - 1) * $perPage;

// Nothing to do without location
if ($locId <= 0) {
   echo json_encode([
      'results' => [],
      'pagination' => ['more' => false]
   ]);
   exit;
}

// Allowed itemtypes (you can adjust)
$allowedTypes = [
   'Database',
   'Computer',
   'NetworkEquipment',
   'Printer',
   'Monitor',
   'Peripheral',
   'Rack',
   'Enclosure',
   'DCRoom',
   'Software',
   'Phone'
];

$types = $allowedTypes;
if ($reqType !== '' && $reqType !== '0' && in_array($reqType, $allowedTypes, true)) {
   $types = [$reqType];
}

$results = [];
$more    = false;

// We'll fetch perPage+1 to detect "more" for Select2
$fetchLimit = $perPage + 1;

foreach ($types as $itemtype) {
   if (!class_exists($itemtype)) {
      continue;
   }

   // Permission check
   if (!method_exists($itemtype, 'canView') || !$itemtype::canView()) {
      continue;
   }

   $table = $itemtype::getTable();

   $criteria = [
      'FROM'  => $table,
      'WHERE' => [
         'locations_id' => $locId,
         'is_deleted'   => 0
      ],
      'ORDER' => 'name ASC',
      'START' => $start,
      'LIMIT' => $fetchLimit,
   ];

   if ($q !== '') {
      $criteria['WHERE'][] = ['name' => ['LIKE', '%' . $DB->escape($q) . '%']];
   }

   $rows = [];
   foreach ($DB->request($criteria) as $row) {
      $rows[] = $row;
   }

   if (count($rows) > $perPage) {
      $more = true;
      $rows = array_slice($rows, 0, $perPage);
   }

   foreach ($rows as $row) {
      $name = $row['name'] ?? ('ID ' . (int)$row['id']);

      $results[] = [
         'id'       => $itemtype . ':' . (int)$row['id'],
         'text'     => $name,
         'itemtype' => $itemtype,
         'items_id' => (int)$row['id']
      ];
   }
}

echo json_encode([
   'results' => $results,
   'pagination' => ['more' => $more]
]);
