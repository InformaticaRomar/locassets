<?php
require_once __DIR__ . '/hook.php';

define('PLUGIN_LOCASSETS_VERSION', '0.1.0');
define("PLUGIN_LOCASSETS_MIN_GLPI_VERSION", "11.0.0");
define("PLUGIN_LOCASSETS_MAX_GLPI_VERSION", "11.0.99");

function plugin_init_locassets(): void {
   global $PLUGIN_HOOKS;

   $PLUGIN_HOOKS['csrf_compliant']['locassets'] = true;
   $PLUGIN_HOOKS['javascript_variables']['locassets'] = [
      'label' => __('My assets (by location)', 'locassets')
   ];

   // Load plugin JS (keep your asset proxy)
   $PLUGIN_HOOKS['add_javascript']['locassets'][] = 'ajax/asset.php?f=locassets.js';
}

function plugin_version_locassets(): array {
   return [
      'name'         => 'Assets by Location',
      'shortname'    => 'locassets',
      'author'       => 'dso',
      'license'      => 'MIT',
      'version'      => PLUGIN_LOCASSETS_VERSION,
      'homepage'     => 'https://github.com/InformaticaRomar/locassets',
      'requirements' => [
         'glpi' => [
            'min' => PLUGIN_LOCASSETS_MIN_GLPI_VERSION,
            'max' => PLUGIN_LOCASSETS_MAX_GLPI_VERSION,
         ],
      ],
   ];
}

function plugin_locassets_check_prerequisites(): bool { return true; }
function plugin_locassets_check_config(bool $verbose = false): bool { return true; }
