<?php
error_reporting(0); // Suppress PHP errors that break JSON

$url = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // TODO: Replace with your deployed Web App URL

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($httpCode !== 200 || !$response) {
    echo json_encode(['error' => 'API failed', 'code' => $httpCode]);
} else {
    echo $response;
}
?>
