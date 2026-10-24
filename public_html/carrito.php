<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fff8fc">
    <meta name="description" content="Revisa tu carrito de Karen Beauty.">
    <title>Carrito | Karen Beauty</title>
    <link rel="stylesheet" href="assets/css/site.css">
    <link rel="stylesheet" href="assets/css/carrito.css">
    <script src="assets/js/site.js" defer></script>
    <script src="assets/js/catalogo-data.js" defer></script>
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
            <a class="site-nav__link cart-nav-link" href="carrito.php" aria-current="page">
                Carrito <span class="cart-nav-link__count" data-cart-count aria-label="Artículos en el carrito">0</span>
            </a>
        </nav>
    </header>

    <main class="cart-page">
        <header class="cart-page__intro">
            <p class="eyebrow">Karen Beauty</p>
            <h1>Tu carrito</h1>
            <p>Revisa los artículos antes de preparar tu mensaje.</p>
        </header>
        <p class="cart-status" data-cart-status role="status" aria-live="polite"></p>
        <div data-cart-content></div>
    </main>

    <footer class="site-footer">
        <p>Karen Beauty</p>
        <p>Tu belleza, tu esencia, tu estilo</p>
    </footer>
</body>
</html>
