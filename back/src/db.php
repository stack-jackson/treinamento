<?php
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;

    $host = getenv('DB_HOST') ?: getenv('POSTGRES_HOST') ?: 'pgsql_desafio';
    $port = getenv('DB_PORT') ?: '5432';
    $dbname = getenv('DB_NAME') ?: getenv('POSTGRES_DB') ?: 'applicationphp';
    $user = getenv('DB_USER') ?: getenv('POSTGRES_USER') ?: 'root';
    $pass = getenv('DB_PASSWORD') ?: getenv('POSTGRES_PASSWORD') ?: 'root';

    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
        exit;
    }
    return $pdo;
}
