<?php
// 100% Portable Stripe Checkout (No Dashboard Price IDs required!)
$STRIPE_SECRET_KEY = 'YOUR_STRIPE_SECRET_KEY';

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['items'])) {
    echo json_encode(['error' => 'No items in cart']);
    exit;
}

$line_items = [];
foreach ($input['items'] as $index => $item) {
    // This part is the "magic" - it creates the price on the fly!
    $line_items["line_items[$index][price_data][currency]"] = 'eur';
    $line_items["line_items[$index][price_data][product_data][name]"] = $item['name'];
    if (!empty($item['image'])) {
        $line_items["line_items[$index][price_data][product_data][images][0]"] = $item['image'];
    }
    $line_items["line_items[$index][price_data][unit_amount]"] = round($item['price'] * 100);
    $line_items["line_items[$index][quantity]"] = $item['quantity'];
}

$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
$dir = rtrim(str_replace('\\', '/', dirname($_SERVER['PHP_SELF'])), '/');
$base_url = $protocol . "://" . $_SERVER['HTTP_HOST'] . $dir;

$data = array_merge($line_items, [
    'mode' => 'payment',
    'success_url' => $base_url . '/success.html',
    'cancel_url' => $base_url . '/cancel.html',
    'payment_method_types[0]' => 'card',
    'billing_address_collection' => 'required',
    'shipping_address_collection[allowed_countries][0]' => 'US', // Add yours (US, GB, FR, etc.)
    'shipping_address_collection[allowed_countries][1]' => 'IT', 
]);

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, $STRIPE_SECRET_KEY . ':');
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
