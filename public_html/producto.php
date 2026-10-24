<?php
$productId = $_GET['id'] ?? '';
if (!is_string($productId)) {
    $productId = '';
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fff8fc">
    <meta name="description" content="Detalle de producto de Karen Beauty.">
    <title>Detalle de producto | Karen Beauty</title>
    <link rel="stylesheet" href="assets/css/site.css">
    <link rel="stylesheet" href="assets/css/catalogo.css">
    <link rel="stylesheet" href="assets/css/carrito.css">
    <script src="assets/js/site.js" defer></script>
    <script src="assets/js/catalogo-data.js" defer></script>
    <script src="assets/js/catalogo.js" defer></script>
    <script src="assets/js/carrito.js" defer></script>
</head>
<body>
    <header class="site-header">
        <a class="brand" href="index.php#inicio" aria-label="Karen Beauty, ir al inicio">
            <span class="brand__name">Karen Beauty</span>
            <span class="brand__tagline">Tu belleza, tu esencia, tu estilo</span>
        </a>

        <button
            class="menu-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="site-navigation"
            aria-label="Abrir menú"
        >
            <span class="menu-toggle__line"></span>
            <span class="menu-toggle__line"></span>
            <span class="menu-toggle__line"></span>
        </button>

        <nav class="site-nav" id="site-navigation" aria-label="Navegación principal">
            <a class="site-nav__link" href="index.php#inicio">Inicio</a>
            <a class="site-nav__link" href="index.php#esencia">Nuestra esencia</a>
            <a class="site-nav__link" href="catalogo.php">Catálogo</a>
            <a class="site-nav__link cart-nav-link" href="carrito.php">
                Carrito <span class="cart-nav-link__count" data-cart-count aria-label="Artículos en el carrito">0</span>
            </a>
        </nav>
    </header>

    <main
        class="catalog-page product-page"
        id="product-detail"
        data-product-id="<?= htmlspecialchars($productId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
    >
        <p class="catalog__status" id="product-status" role="status" aria-live="polite">
            Cargando producto…
        </p>
        <div id="product-detail-content"></div>
    </main>

    <footer class="site-footer">
        <p>Karen Beauty</p>
        <p>Tu belleza, tu esencia, tu estilo</p>
    </footer>
</body>
</html>
