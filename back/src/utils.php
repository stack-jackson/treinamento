<?php
function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond($data, int $status=200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function route_path(): string {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    // If this backend is served under /api, strip it (works with nginx location /api)
    $uri = preg_replace('#^/api#', '', $uri);
    return rtrim($uri, '/') ?: '/';
}

function path_params(string $pattern, string $path): ?array {
    // Pattern like '/products/{id}'
    $regex = preg_replace('#\{([a-z_]+)\}#i', '(?P<$1>[^/]+)', $pattern);
    if (preg_match('#^'.$regex.'$#', $path, $m)) {
        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
    return null;
}
