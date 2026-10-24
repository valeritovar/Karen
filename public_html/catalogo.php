<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fff8fc">
    <meta name="description" content="Explora el catálogo de Karen Beauty.">
    <title>Catálogo | Karen Beauty</title>
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
            <a class="site-nav__link" href="catalogo.php" aria-current="page">Catálogo</a>
            <a class="site-nav__link cart-nav-link" href="carrito.php">
                Carrito <span class="cart-nav-link__count" data-cart-count aria-label="Artículos en el carrito">0</span>
            </a>
        </nav>
    </header>

    <main class="catalog-page">
        <section class="catalog-intro" aria-labelledby="catalog-title">
            <p class="eyebrow">Karen Beauty</p>
            <h1 id="catalog-title">Nuestro catálogo</h1>
            <p>Explora las categorías y encuentra inspiración para tu estilo.</p>
        </section>

        <section class="catalog" aria-label="Productos">
            <form class="catalog-filters" id="catalog-filters">
                <div class="catalog-filters__field catalog-filters__field--search">
                    <label for="product-search">Buscar por nombre</label>
                    <input
                        id="product-search"
                        name="search"
                        type="search"
                        autocomplete="off"
                        placeholder="Escribe un nombre"
                    >
                </div>

                <div class="catalog-filters__field">
                    <label for="category-filter">Categoría</label>
                    <select id="category-filter" name="category">
                        <option value="">Todas las categorías</option>
                        <option value="maquillaje">Maquillaje</option>
                        <option value="cuidado-facial">Cuidado facial</option>
                        <option value="cuidado-capilar">Cuidado capilar</option>
                        <option value="perfumeria-cuerpo">Perfumería y cuerpo</option>
                        <option value="unas-accesorios">Uñas y accesorios</option>
                    </select>
                </div>

                <div class="catalog-filters__field">
                    <label for="availability-filter">Disponibilidad</label>
                    <select id="availability-filter" name="availability">
                        <option value="">Todas</option>
                        <option value="available">Disponible</option>
                        <option value="unavailable">No disponible</option>
                    </select>
                </div>

                <button class="catalog-filters__reset" type="reset">Limpiar filtros</button>
            </form>

            <p class="catalog__status" id="catalog-status" role="status" aria-live="polite"></p>
            <div class="product-grid" id="product-grid" aria-label="Resultados del catálogo"></div>
        </section>
    </main>

    <footer class="site-footer">
        <p>Karen Beauty</p>
        <p>Tu belleza, tu esencia, tu estilo</p>
    </footer>
</body>
</html>
