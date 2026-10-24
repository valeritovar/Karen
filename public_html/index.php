<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fff8fc">
    <meta name="description" content="Karen Beauty. Tu belleza, tu esencia, tu estilo.">
    <title>Karen Beauty | Tu belleza, tu esencia, tu estilo</title>
    <link rel="stylesheet" href="assets/css/site.css">
    <link rel="stylesheet" href="assets/css/carrito.css">
    <script src="assets/js/site.js" defer></script>
    <script src="assets/js/catalogo-data.js" defer></script>
    <script src="assets/js/carrito.js" defer></script>
</head>
<body>
    <header class="site-header">
        <a class="brand" href="#inicio" aria-label="Karen Beauty, ir al inicio">
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
            <a class="site-nav__link" href="#inicio">Inicio</a>
            <a class="site-nav__link" href="#esencia">Nuestra esencia</a>
            <a class="site-nav__link" href="catalogo.php">Catálogo</a>
            <a class="site-nav__link cart-nav-link" href="carrito.php">
                Carrito <span class="cart-nav-link__count" data-cart-count aria-label="Artículos en el carrito">0</span>
            </a>
        </nav>
    </header>

    <main>
        <section class="hero" id="inicio" aria-labelledby="hero-title">
            <div class="hero__content">
                <p class="eyebrow">Karen Beauty</p>
                <h1 id="hero-title">Tu belleza,<br><span>tu esencia,</span><br>tu estilo.</h1>
                <p class="hero__description">
                    Un espacio creado para celebrar aquello que te hace única.
                </p>
                <div class="hero__actions">
                    <a class="button-link" href="#esencia">Conoce nuestra esencia</a>
                    <a class="button-link button-link--secondary" href="catalogo.php">Explora el catálogo</a>
                </div>
            </div>
            <div class="hero__art" aria-hidden="true">
                <div class="hero__shape hero__shape--outer"></div>
                <div class="hero__shape hero__shape--inner"></div>
                <span class="hero__monogram">KB</span>
                <span class="hero__beauty-item hero__beauty-item--lipstick">
                    <span class="hero__beauty-item-cap"></span>
                    <span class="hero__beauty-item-body"></span>
                </span>
                <span class="hero__beauty-item hero__beauty-item--compact">
                    <span class="hero__beauty-item-center">KB</span>
                </span>
                <span class="hero__beauty-flower">✿</span>
            </div>
        </section>

        <section class="essence" id="esencia" aria-labelledby="essence-title">
            <p class="eyebrow">Nuestra esencia</p>
            <h2 id="essence-title">Belleza con estilo propio</h2>
            <p>
                Karen Beauty: un nombre, una esencia y un estilo que te pertenecen.
            </p>
        </section>
    </main>

    <footer class="site-footer">
        <p>Karen Beauty</p>
        <p>Tu belleza, tu esencia, tu estilo</p>
    </footer>
</body>
</html>
