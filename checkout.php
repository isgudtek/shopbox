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
    'shipping_address_collection[allowed_countries][0]' => 'AT',  // Austria
    'shipping_address_collection[allowed_countries][1]' => 'BE',  // Belgium
    'shipping_address_collection[allowed_countries][2]' => 'BG',  // Bulgaria
    'shipping_address_collection[allowed_countries][3]' => 'HR',  // Croatia
    'shipping_address_collection[allowed_countries][4]' => 'CY',  // Cyprus
    'shipping_address_collection[allowed_countries][5]' => 'CZ',  // Czech Republic
    'shipping_address_collection[allowed_countries][6]' => 'DK',  // Denmark
    'shipping_address_collection[allowed_countries][7]' => 'EE',  // Estonia
    'shipping_address_collection[allowed_countries][8]' => 'FI',  // Finland
    'shipping_address_collection[allowed_countries][9]' => 'FR',  // France
    'shipping_address_collection[allowed_countries][10]' => 'DE', // Germany
    'shipping_address_collection[allowed_countries][11]' => 'GR', // Greece
    'shipping_address_collection[allowed_countries][12]' => 'HU', // Hungary
    'shipping_address_collection[allowed_countries][13]' => 'IE', // Ireland
    'shipping_address_collection[allowed_countries][14]' => 'IT', // Italy
    'shipping_address_collection[allowed_countries][15]' => 'LV', // Latvia
    'shipping_address_collection[allowed_countries][16]' => 'LT', // Lithuania
    'shipping_address_collection[allowed_countries][17]' => 'LU', // Luxembourg
    'shipping_address_collection[allowed_countries][18]' => 'MT', // Malta
    'shipping_address_collection[allowed_countries][19]' => 'NL', // Netherlands
    'shipping_address_collection[allowed_countries][20]' => 'PL', // Poland
    'shipping_address_collection[allowed_countries][21]' => 'PT', // Portugal
    'shipping_address_collection[allowed_countries][22]' => 'RO', // Romania
    'shipping_address_collection[allowed_countries][23]' => 'SK', // Slovakia
    'shipping_address_collection[allowed_countries][24]' => 'SI', // Slovenia
    'shipping_address_collection[allowed_countries][25]' => 'ES', // Spain
    'shipping_address_collection[allowed_countries][26]' => 'SE', // Sweden
    'shipping_address_collection[allowed_countries][27]' => 'US', // United States 
]);

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, $STRIPE_SECRET_KEY . ':');
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
