<?php
/**
 * Contentful Synchronization Web Endpoint
 * 
 * This endpoint allows triggering Contentful synchronization via HTTP request.
 * 
 * Usage:
 *   GET/POST: /sync-contentful-web.php?token=YOUR_SECRET_TOKEN
 * 
 * Security: Always use a secret token to prevent unauthorized access
 */

// Security token - CHANGE THIS TO A RANDOM STRING!
// For local testing, you can use a simple token like 'test123'
// For production, use a strong random string!
$SECRET_TOKEN = 'test123';

// Check if token is provided and valid
$providedToken = $_GET['token'] ?? $_POST['token'] ?? '';

if (empty($providedToken) || $providedToken !== $SECRET_TOKEN) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized. Invalid or missing token.'
    ]);
    exit;
}

// Set execution time limit for long-running script
set_time_limit(300); // 5 minutes

// Include the sync script
// The script will automatically detect it's running from web and return JSON
require_once __DIR__ . '/sync-contentful.php';

