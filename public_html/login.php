<?php
declare(strict_types=1);

header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

$statusMessage = '';
$email = '';
$authenticatedUser = null;
$csrfToken = '';
$serviceAvailable = false;

try {
    $privateDirectorySetting = getenv('KAREN_PRIVATE_DIR');
    $privateDirectoryPath = is_string($privateDirectorySetting) && $privateDirectorySetting !== ''
        ? $privateDirectorySetting
        : '/home/u718666575/private';
    $privateDirectory = realpath($privateDirectoryPath);
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');

    if ($privateDirectory === false || $documentRoot === false) {
        throw new RuntimeException('La ruta privada de autenticación no está configurada.');
    }

    $publicPrefix = rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
    if (
        $privateDirectory === $documentRoot
        || str_starts_with(
            $privateDirectory . DIRECTORY_SEPARATOR,
            $publicPrefix
        )
    ) {
        throw new RuntimeException('La ruta privada está dentro de la raíz pública.');
    }

    $authFile = $privateDirectory . DIRECTORY_SEPARATOR . 'auth.php';
    if (!is_file($authFile)) {
        throw new RuntimeException('No se encontró el módulo privado de autenticación.');
    }

    require_once $authFile;
    if (!kb_auth_is_secure_request()) {
        http_response_code(403);
        $statusMessage = 'Para iniciar sesión, utiliza una conexión HTTPS segura.';
    } else {
        kb_auth_start_session();
        $csrfToken = kb_auth_csrf_token();
        $authenticatedUser = kb_auth_current_user();
        $serviceAvailable = true;

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $submittedToken = $_POST['csrf_token'] ?? '';
            if (!is_string($submittedToken) || !kb_auth_verify_csrf($submittedToken)) {
                http_response_code(400);
                $statusMessage = 'La solicitud no pudo validarse. Recarga la página e inténtalo de nuevo.';
            } else {
                $submittedEmail = $_POST['email'] ?? '';
                $password = $_POST['password'] ?? '';
                $email = is_string($submittedEmail) ? strtolower(trim($submittedEmail)) : '';
                $password = is_string($password) ? $password : '';
                $emailIsValid = strlen($email) <= 254
                    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
                $passwordIsValid = $password !== '' && strlen($password) <= 4096;

                try {
                    $database = kb_database_connection();
                    $emailForLimit = substr($email, 0, 254);

                    if (kb_auth_is_rate_limited($database, $emailForLimit)) {
                        $statusMessage = 'No fue posible iniciar sesión. Espera antes de volver a intentarlo.';
                    } else {
                        $user = null;
                        if ($emailIsValid) {
                            $statement = $database->prepare(
                                'SELECT id, email, password_hash, is_active
                                 FROM admin_users
                                 WHERE email = :email
                                 LIMIT 1'
                            );
                            $statement->execute(['email' => $email]);
                            $user = $statement->fetch();
                        }

                        $passwordMatches = $user !== false
                            && is_array($user)
                            && $passwordIsValid
                            && password_verify($password, $user['password_hash']);
                        $accountIsActive = $user !== false
                            && is_array($user)
                            && (int) $user['is_active'] === 1;

                        if ($passwordMatches && $accountIsActive) {
                            kb_auth_clear_failures($database, $emailForLimit);
                            kb_auth_login((int) $user['id']);
                            header('Location: login.php?authenticated=1', true, 303);
                            exit;
                        }

                        kb_auth_record_failure($database, $emailForLimit);
                        $statusMessage = 'No fue posible iniciar sesión. Verifica tus datos o espera antes de volver a intentarlo.';
                    }
                } catch (Throwable $exception) {
                    error_log(
                        'Karen Beauty authentication failure: '
                        . get_class($exception)
                        . ' code='
                        . (string) $exception->getCode()
                    );
                    http_response_code(503);
                    $statusMessage = 'El servicio de acceso no está disponible por el momento.';
                }
            }
        } elseif ($authenticatedUser !== null) {
            $statusMessage = isset($_GET['authenticated'])
                ? 'Sesión iniciada correctamente.'
                : 'Ya tienes una sesión iniciada.';
        } elseif (isset($_GET['logged_out'])) {
            $statusMessage = 'Has cerrado la sesión.';
        }
    }
} catch (Throwable $exception) {
    error_log(
        'Karen Beauty authentication bootstrap failure: '
        . get_class($exception)
        . ' code='
        . (string) $exception->getCode()
    );
    http_response_code(503);
    $statusMessage = 'El servicio de acceso no está disponible por el momento.';
}

$escapeHtml = static fn (string $value): string => htmlspecialchars(
    $value,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fff8fc">
    <meta name="robots" content="noindex, nofollow">
    <title>Acceso administrativo | Karen Beauty</title>
    <link rel="stylesheet" href="assets/css/site.css">
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page">
    <main class="auth-card">
        <a class="auth-brand" href="index.php">
            <span class="auth-brand__name">Karen Beauty</span>
            <span class="auth-brand__tagline">Tu belleza, tu esencia, tu estilo</span>
        </a>

        <h1>Acceso administrativo</h1>
        <p class="auth-card__intro">Inicia sesión para continuar.</p>

        <?php if ($statusMessage !== ''): ?>
            <p
                class="auth-message<?= $serviceAvailable ? '' : ' auth-message--error' ?>"
                role="<?= $serviceAvailable ? 'status' : 'alert' ?>"
                aria-live="polite"
            ><?= $escapeHtml($statusMessage) ?></p>
        <?php endif; ?>

        <?php if ($serviceAvailable && $authenticatedUser !== null): ?>
            <form action="logout.php" method="post" class="auth-form">
                <input type="hidden" name="csrf_token" value="<?= $escapeHtml($csrfToken) ?>">
                <button class="auth-button" type="submit">Cerrar sesión</button>
            </form>
        <?php elseif ($serviceAvailable): ?>
            <form action="login.php" method="post" class="auth-form">
                <input type="hidden" name="csrf_token" value="<?= $escapeHtml($csrfToken) ?>">

                <label for="email">Correo electrónico</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    inputmode="email"
                    autocomplete="username"
                    maxlength="254"
                    value="<?= $escapeHtml($email) ?>"
                    required
                >

                <label for="password">Contraseña</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                    maxlength="4096"
                    required
                >

                <button class="auth-button" type="submit">Iniciar sesión</button>
            </form>
        <?php endif; ?>

        <a class="auth-back-link" href="index.php">Volver a Karen Beauty</a>
    </main>
</body>
</html>
