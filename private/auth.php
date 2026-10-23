<?php
declare(strict_types=1);

require_once __DIR__ . DIRECTORY_SEPARATOR . 'database.php';

const KB_AUTH_SESSION_NAME = 'KARENBEAUTYSESSID';
const KB_AUTH_MAX_FAILURES = 5;
const KB_AUTH_FAILURE_WINDOW_MINUTES = 15;
const KB_AUTH_SESSION_IDLE_SECONDS = 1800;

function kb_auth_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    if (session_status() !== PHP_SESSION_NONE || headers_sent()) {
        throw new RuntimeException('No fue posible iniciar la sesión.');
    }

    session_name(KB_AUTH_SESSION_NAME);
    if (
        ini_set('session.use_strict_mode', '1') === false
        || ini_set('session.use_only_cookies', '1') === false
        || ini_set('session.use_trans_sid', '0') === false
    ) {
        throw new RuntimeException('No fue posible aplicar la configuración segura de sesión.');
    }

    if (!session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => kb_auth_is_https(),
        'httponly' => true,
        'samesite' => 'Lax'
    ])) {
        throw new RuntimeException('No fue posible configurar la cookie de sesión.');
    }

    if (!session_start()) {
        throw new RuntimeException('No fue posible iniciar la sesión.');
    }

    if (isset($_SESSION['kb_last_activity'])) {
        $lastActivity = filter_var($_SESSION['kb_last_activity'], FILTER_VALIDATE_INT);
        if (
            $lastActivity === false
            || time() - $lastActivity > KB_AUTH_SESSION_IDLE_SECONDS
        ) {
            $_SESSION = [];
            if (!session_regenerate_id(true)) {
                throw new RuntimeException('No fue posible renovar una sesión vencida.');
            }
        }
    }

    $_SESSION['kb_last_activity'] = time();
}

function kb_auth_is_https(): bool
{
    $httpsValue = $_SERVER['HTTPS'] ?? null;
    if (is_string($httpsValue) && in_array(strtolower($httpsValue), ['on', '1'], true)) {
        return true;
    }

    return isset($_SERVER['SERVER_PORT'])
        && (string) $_SERVER['SERVER_PORT'] === '443';
}

function kb_auth_is_secure_request(): bool
{
    if (kb_auth_is_https()) {
        return true;
    }

    if (
        PHP_SAPI !== 'cli-server'
        || getenv('KAREN_AUTH_ALLOW_INSECURE_LOCAL') !== '1'
    ) {
        return false;
    }

    $remoteAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $hostHeader = $_SERVER['HTTP_HOST'] ?? '';
    $host = is_string($hostHeader)
        ? parse_url('http://' . $hostHeader, PHP_URL_HOST)
        : false;

    return in_array($remoteAddress, ['127.0.0.1', '::1'], true)
        && in_array(strtolower((string) $host), ['127.0.0.1', 'localhost', '[::1]', '::1'], true);
}

function kb_auth_csrf_token(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        throw new RuntimeException('La sesión no está activa.');
    }

    if (!isset($_SESSION['kb_csrf_token']) || !is_string($_SESSION['kb_csrf_token'])) {
        $_SESSION['kb_csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['kb_csrf_token'];
}

function kb_auth_verify_csrf(string $submittedToken): bool
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return false;
    }

    $storedToken = $_SESSION['kb_csrf_token'] ?? null;
    return is_string($storedToken)
        && $storedToken !== ''
        && hash_equals($storedToken, $submittedToken);
}

function kb_auth_current_user(): ?array
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return null;
    }

    $userId = $_SESSION['kb_user_id'] ?? null;
    if (!is_int($userId) || $userId < 1) {
        return null;
    }

    return ['id' => $userId];
}

function kb_auth_login(int $userId): void
{
    if (session_status() !== PHP_SESSION_ACTIVE || $userId < 1) {
        throw new RuntimeException('No fue posible iniciar la sesión autenticada.');
    }

    if (!session_regenerate_id(true)) {
        throw new RuntimeException('No fue posible renovar la sesión.');
    }

    $_SESSION = [
        'kb_user_id' => $userId,
        'kb_authenticated_at' => time(),
        'kb_last_activity' => time(),
        'kb_csrf_token' => bin2hex(random_bytes(32))
    ];
}

function kb_auth_rate_limit_hashes(string $email): array
{
    $configuration = kb_database_config();
    $key = hex2bin($configuration['rate_limit_key']);
    if ($key === false) {
        throw new RuntimeException('La clave privada de limitación no es válida.');
    }

    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
    $ipAddress = is_string($ipAddress) && filter_var($ipAddress, FILTER_VALIDATE_IP)
        ? $ipAddress
        : 'unknown';

    return [
        'email' => hash_hmac('sha256', strtolower($email), $key),
        'ip' => hash_hmac('sha256', $ipAddress, $key)
    ];
}

function kb_auth_is_rate_limited(PDO $database, string $email): bool
{
    $hashes = kb_auth_rate_limit_hashes($email);
    $statement = $database->prepare(
        'SELECT COUNT(*)
         FROM login_attempts
         WHERE failed_at >= (UTC_TIMESTAMP() - INTERVAL '
            . KB_AUTH_FAILURE_WINDOW_MINUTES
            . ' MINUTE)
           AND (email_hash = :email_hash OR ip_hash = :ip_hash)'
    );
    $statement->execute([
        'email_hash' => $hashes['email'],
        'ip_hash' => $hashes['ip']
    ]);

    return (int) $statement->fetchColumn() >= KB_AUTH_MAX_FAILURES;
}

function kb_auth_record_failure(PDO $database, string $email): void
{
    $hashes = kb_auth_rate_limit_hashes($email);
    $statement = $database->prepare(
        'INSERT INTO login_attempts (email_hash, ip_hash, failed_at)
         VALUES (:email_hash, :ip_hash, UTC_TIMESTAMP())'
    );
    $statement->execute([
        'email_hash' => $hashes['email'],
        'ip_hash' => $hashes['ip']
    ]);

    $cleanup = $database->prepare(
        'DELETE FROM login_attempts
         WHERE failed_at < (UTC_TIMESTAMP() - INTERVAL 1 DAY)'
    );
    $cleanup->execute();
}

function kb_auth_clear_failures(PDO $database, string $email): void
{
    $hashes = kb_auth_rate_limit_hashes($email);
    $statement = $database->prepare(
        'DELETE FROM login_attempts
         WHERE email_hash = :email_hash'
    );
    $statement->execute(['email_hash' => $hashes['email']]);
}

function kb_auth_destroy_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        return;
    }

    $_SESSION = [];
    $cookieParameters = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $cookieParameters['path'],
        'domain' => $cookieParameters['domain'],
        'secure' => $cookieParameters['secure'],
        'httponly' => $cookieParameters['httponly'],
        'samesite' => $cookieParameters['samesite'] ?? 'Lax'
    ]);
    session_destroy();
}
