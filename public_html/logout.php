<?php
declare(strict_types=1);

$privateDirectorySetting = getenv('KAREN_PRIVATE_DIR');
$privateDirectoryPath = is_string($privateDirectorySetting) && $privateDirectorySetting !== ''
    ? $privateDirectorySetting
    : '/home/u718666575/private';
$privateDirectory = realpath($privateDirectoryPath);
$documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');

if ($privateDirectory === false || $documentRoot === false) {
    error_log('Karen Beauty logout unavailable: private path is not configured.');
    http_response_code(503);
    exit('El servicio de acceso no está disponible por el momento.');
}

$publicPrefix = rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
if (
    $privateDirectory === $documentRoot
    || str_starts_with($privateDirectory . DIRECTORY_SEPARATOR, $publicPrefix)
) {
    error_log('Karen Beauty logout unavailable: private path is inside the public root.');
    http_response_code(503);
    exit('El servicio de acceso no está disponible por el momento.');
}

$authFile = $privateDirectory . DIRECTORY_SEPARATOR . 'auth.php';
if (!is_file($authFile)) {
    error_log('Karen Beauty logout unavailable: private authentication module is missing.');
    http_response_code(503);
    exit('El servicio de acceso no está disponible por el momento.');
}

try {
    require_once $authFile;
    if (!kb_auth_is_secure_request()) {
        http_response_code(403);
        exit('Para cerrar sesión, utiliza una conexión HTTPS segura.');
    }

    kb_auth_start_session();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Location: login.php', true, 303);
        exit;
    }

    $submittedToken = $_POST['csrf_token'] ?? '';
    if (!is_string($submittedToken) || !kb_auth_verify_csrf($submittedToken)) {
        http_response_code(400);
        exit('La solicitud no pudo validarse. Regresa e inténtalo de nuevo.');
    }

    kb_auth_destroy_session();
    header('Location: login.php?logged_out=1', true, 303);
    exit;
} catch (Throwable $exception) {
    error_log(
        'Karen Beauty logout failure: '
        . get_class($exception)
        . ' code='
        . (string) $exception->getCode()
    );
    http_response_code(503);
    exit('El servicio de acceso no está disponible por el momento.');
}
