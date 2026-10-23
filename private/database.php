<?php
declare(strict_types=1);

function kb_database_config(): array
{
    static $configuration = null;

    if (is_array($configuration)) {
        return $configuration;
    }

    $configurationPathSetting = getenv('KAREN_CONFIG_FILE');
    $configurationPathValue = is_string($configurationPathSetting) && $configurationPathSetting !== ''
        ? $configurationPathSetting
        : __DIR__ . DIRECTORY_SEPARATOR . 'config.php';
    $configurationPath = realpath($configurationPathValue);
    $privateDirectory = realpath(__DIR__);
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');

    if (
        $configurationPath === false
        || $privateDirectory === false
        || $documentRoot === false
        || dirname($configurationPath) !== $privateDirectory
    ) {
        throw new RuntimeException('La configuración privada de la base de datos no está disponible.');
    }

    $publicPrefix = rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (
        $configurationPath === $documentRoot
        || str_starts_with($configurationPath, $publicPrefix)
    ) {
        throw new RuntimeException('La configuración de base de datos debe estar fuera de la raíz pública.');
    }

    $loadedConfiguration = require $configurationPath;
    if (!is_array($loadedConfiguration)) {
        throw new RuntimeException('El formato de configuración privada no es válido.');
    }

    foreach (['host', 'database', 'username', 'password', 'rate_limit_key'] as $requiredKey) {
        if (!isset($loadedConfiguration[$requiredKey]) || !is_string($loadedConfiguration[$requiredKey])) {
            throw new RuntimeException('Falta un valor requerido en la configuración privada.');
        }
    }

    if (
        $loadedConfiguration['host'] === ''
        || !preg_match('/^[A-Za-z0-9._:-]+$/', $loadedConfiguration['host'])
        || !preg_match('/^[A-Za-z0-9_]+$/', $loadedConfiguration['database'])
        || $loadedConfiguration['username'] === ''
        || $loadedConfiguration['password'] === ''
        || !preg_match('/^[a-fA-F0-9]{64,}$/', $loadedConfiguration['rate_limit_key'])
    ) {
        throw new RuntimeException('La configuración privada contiene valores no válidos.');
    }

    $configuration = $loadedConfiguration;
    return $configuration;
}

function kb_database_connection(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('El controlador PDO MySQL no está disponible.');
    }

    $configuration = kb_database_config();
    $dataSource = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $configuration['host'],
        $configuration['database']
    );

    $connection = new PDO(
        $dataSource,
        $configuration['username'],
        $configuration['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false
        ]
    );

    return $connection;
}
