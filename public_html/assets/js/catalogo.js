"use strict";

const catalogProducts = window.KAREN_BEAUTY_DEMO_PRODUCTS;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    };
    return entities[character];
});

const beautyCategoryIcons = {
    maquillaje: "💄",
    "cuidado-facial": "🌸",
    "cuidado-capilar": "🧴",
    "perfumeria-cuerpo": "✨",
    "unas-accesorios": "💅"
};

const createDemoArt = (label, category = "", extraClass = "") => `
    <div class="demo-art ${extraClass} demo-art--${category}" role="img" aria-label="Ilustración de ${escapeHtml(label)}">
        <span class="demo-art__monogram" aria-hidden="true">KB</span>
        <span class="demo-art__beauty-icon" aria-hidden="true">${beautyCategoryIcons[category] || "✦"}</span>
    </div>
`;

const getValid360Photos = (photos, productName) => {
    if (!Array.isArray(photos)) {
        return [];
    }

    return photos.reduce((validPhotos, photo, index) => {
        const source = typeof photo === "string"
            ? photo
            : photo && typeof photo === "object" && typeof photo.src === "string"
                ? photo.src
                : "";

        if (!source.trim()) {
            return validPhotos;
        }

        let url;
        try {
            url = new URL(source.trim(), window.location.href);
        } catch {
            return validPhotos;
        }

        if (
            (url.protocol !== "http:" && url.protocol !== "https:")
            || url.origin !== window.location.origin
        ) {
            return validPhotos;
        }

        const suppliedAlt = photo && typeof photo === "object" && typeof photo.alt === "string"
            ? photo.alt.trim()
            : "";

        validPhotos.push({
            src: url.href,
            alt: suppliedAlt || `${productName}, ángulo ${index + 1}`,
            index
        });

        return validPhotos;
    }, []).slice(0, 24);
};

const create360ViewerMarkup = (product) => {
    const photos = getValid360Photos(product.photos360, product.name);

    if (photos.length === 0) {
        return `
            <section class="product-detail__section product-360" aria-labelledby="product-360-title">
                <h2 id="product-360-title">Vista 360°</h2>
                <p class="product-360__unavailable">
                    La vista 360° aún no está disponible para este producto.
                </p>
            </section>
        `;
    }

    return `
        <section class="product-detail__section product-360" aria-labelledby="product-360-title">
            <h2 id="product-360-title">Vista 360°</h2>
            <div class="product-360__viewer" data-product-360-viewer>
                <div
                    class="product-360__frame"
                    data-product-360-frame
                    tabindex="0"
                    aria-label="Visor de fotografías 360 grados. Usa las flechas izquierda y derecha para cambiar el ángulo."
                >
                    <p class="product-360__message" data-product-360-message role="status" aria-live="polite">
                        Cargando fotografías…
                    </p>
                </div>
                <div class="product-360__controls">
                    <button class="product-360__button" type="button" data-product-360-previous aria-label="Mostrar ángulo anterior">
                        Anterior
                    </button>
                    <p class="product-360__indicator" data-product-360-indicator role="status" aria-live="polite">
                        Cargando…
                    </p>
                    <button class="product-360__button" type="button" data-product-360-next aria-label="Mostrar ángulo siguiente">
                        Siguiente
                    </button>
                </div>
                <p class="product-360__hint">Arrastra la imagen o desliza para cambiar el ángulo.</p>
            </div>
        </section>
    `;
};

const initialize360Viewer = (viewer, product) => {
    const photos = getValid360Photos(product.photos360, product.name);
    const frame = viewer.querySelector("[data-product-360-frame]");
    const message = viewer.querySelector("[data-product-360-message]");
    const indicator = viewer.querySelector("[data-product-360-indicator]");
    const previousButton = viewer.querySelector("[data-product-360-previous]");
    const nextButton = viewer.querySelector("[data-product-360-next]");
    const loadedPhotos = new Map();
    const failedIndices = new Set();
    let currentIndex = -1;
    let isLoading = false;
    let pointerStartX = null;

    const updateControls = () => {
        const allOtherPhotosFailed = currentIndex >= 0
            && failedIndices.size >= photos.length - 1;
        const disabled = photos.length < 2 || currentIndex < 0 || allOtherPhotosFailed || isLoading;

        previousButton.disabled = disabled;
        nextButton.disabled = disabled;
    };

    const loadPhoto = (photo, index) => {
        if (loadedPhotos.has(index)) {
            return Promise.resolve(loadedPhotos.get(index));
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.decoding = "async";
            image.alt = photo.alt;
            image.draggable = false;
            image.className = "product-360__image";
            image.onload = () => {
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    loadedPhotos.set(index, image);
                    resolve(image);
                } else {
                    reject(new Error("La fotografía no contiene dimensiones válidas."));
                }
            };
            image.onerror = () => reject(new Error("No se pudo cargar la fotografía."));
            image.src = photo.src;
        });
    };

    const findAndShowPhoto = async (startIndex, direction, attempts) => {
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const index = (startIndex + direction * attempt + photos.length) % photos.length;

            if (index === currentIndex || failedIndices.has(index)) {
                continue;
            }

            try {
                const image = await loadPhoto(photos[index], index);
                currentIndex = index;
                frame.replaceChildren(image);
                message.hidden = true;
                indicator.textContent = `Ángulo ${index + 1} de ${photos.length}`;
                updateControls();
                return true;
            } catch {
                failedIndices.add(index);
            }
        }

        if (currentIndex < 0) {
            message.textContent = "La vista 360° aún no está disponible: no se pudieron cargar fotografías.";
            indicator.textContent = "Vista 360° no disponible";
        }

        updateControls();
        return false;
    };

    const moveBy = async (direction) => {
        if (isLoading || photos.length < 2 || currentIndex < 0) {
            return;
        }

        isLoading = true;
        updateControls();
        await findAndShowPhoto((currentIndex + direction + photos.length) % photos.length, direction, photos.length - 1);
        isLoading = false;
        updateControls();
    };

    previousButton.addEventListener("click", () => moveBy(-1));
    nextButton.addEventListener("click", () => moveBy(1));

    frame.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveBy(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveBy(1);
        }
    });

    frame.addEventListener("pointerdown", (event) => {
        if (event.isPrimary && (event.pointerType !== "mouse" || event.button === 0)) {
            pointerStartX = event.clientX;
            frame.setPointerCapture(event.pointerId);
        }
    });

    frame.addEventListener("pointerup", (event) => {
        if (pointerStartX === null) {
            return;
        }

        const distance = event.clientX - pointerStartX;
        pointerStartX = null;

        if (Math.abs(distance) >= 30) {
            moveBy(distance < 0 ? 1 : -1);
        }
    });

    frame.addEventListener("pointercancel", () => {
        pointerStartX = null;
    });

    isLoading = true;
    updateControls();
    findAndShowPhoto(0, 1, photos.length).finally(() => {
        isLoading = false;
        updateControls();
    });
};

const catalogRoot = document.querySelector("#product-grid");

if (catalogRoot) {
    const form = document.querySelector("#catalog-filters");
    const searchInput = document.querySelector("#product-search");
    const categoryFilter = document.querySelector("#category-filter");
    const availabilityFilter = document.querySelector("#availability-filter");
    const status = document.querySelector("#catalog-status");

    if (!Array.isArray(catalogProducts)) {
        status.textContent = "No fue posible cargar el catálogo.";
    } else {
        const renderCatalog = () => {
            const searchTerm = searchInput.value.trim().toLocaleLowerCase();
            const selectedCategory = categoryFilter.value;
            const selectedAvailability = availabilityFilter.value;

            let visibleProducts = catalogProducts.filter((product) => {
                const matchesName = product.name.toLocaleLowerCase().includes(searchTerm);
                const matchesCategory = !selectedCategory || product.category === selectedCategory;
                const matchesAvailability = !selectedAvailability
                    || (selectedAvailability === "available" && product.available)
                    || (selectedAvailability === "unavailable" && !product.available);

                return matchesName && matchesCategory && matchesAvailability;
            });

            status.textContent = visibleProducts.length === 1
                ? "1 producto."
                : `${visibleProducts.length} productos.`;

            if (visibleProducts.length === 0) {
                catalogRoot.innerHTML = `
                    <div class="catalog-empty">
                        <p>No encontramos productos con esos filtros.</p>
                    </div>
                `;
                return;
            }

            catalogRoot.innerHTML = visibleProducts.map((product) => `
                <article class="product-card">
                    <a class="product-card__link" href="producto.php?id=${encodeURIComponent(product.id)}">
                        ${createDemoArt(product.name, product.category)}
                        <div class="product-card__body">
                            <p class="product-card__category">${escapeHtml(product.categoryLabel)}</p>
                            <h2 class="product-card__title">${escapeHtml(product.name)}</h2>
                            <p class="product-card__price">
                                Precio por confirmar
                            </p>
                            <p class="product-card__availability" data-available="${product.available}">
                                ${product.available ? "Disponible" : "No disponible"}
                            </p>
                        </div>
                    </a>
                    <button class="cart-action" type="button" data-cart-add="${escapeHtml(product.id)}">
                        Añadir al carrito
                    </button>
                </article>
            `).join("");
        };

        form.addEventListener("input", renderCatalog);
        form.addEventListener("change", renderCatalog);
        form.addEventListener("reset", () => {
            window.requestAnimationFrame(renderCatalog);
        });

        renderCatalog();
    }
}

const detailRoot = document.querySelector("#product-detail");

if (detailRoot) {
    const status = document.querySelector("#product-status");
    const content = document.querySelector("#product-detail-content");

    if (!Array.isArray(catalogProducts)) {
        status.textContent = "No fue posible cargar el producto.";
    } else {
        const product = catalogProducts.find((item) => item.id === detailRoot.dataset.productId);

        if (!product) {
            status.textContent = "";
            content.innerHTML = `
                <div class="product-not-found">
                    <h1>Producto no encontrado</h1>
                    <a class="button-link" href="catalogo.php">Volver al catálogo</a>
                </div>
            `;
        } else {
            status.textContent = "";

            const galleryMarkup = Array.isArray(product.photos) && product.photos.length > 0
                ? product.photos.map((photo) => `
                    <img
                        class="product-detail__photo"
                        src="${escapeHtml(photo.src)}"
                        alt="${escapeHtml(photo.alt)}"
                        loading="lazy"
                    >
                `).join("")
                : createDemoArt(product.name, product.category);

            content.innerHTML = `
                <article class="product-detail">
                    <a class="product-detail__back" href="catalogo.php">← Volver al catálogo</a>
                    <div class="product-detail__layout">
                        ${createDemoArt(product.name, product.category, "product-detail__art")}
                        <div class="product-detail__information">
                            <p class="product-card__category">${escapeHtml(product.categoryLabel)}</p>
                            <h1 class="product-detail__title">${escapeHtml(product.name)}</h1>
                            <p class="product-detail__price">
                                Precio por confirmar
                            </p>
                            <p class="product-detail__availability">
                                ${product.available ? "Disponible" : "No disponible"}
                            </p>
                            <p class="product-detail__description">${escapeHtml(product.description)}</p>
                            <section class="product-detail__section">
                                <h2>Presentación</h2>
                                <p>${escapeHtml(product.presentation)}</p>
                            </section>
                            <button class="cart-action product-detail__cart-action" type="button" data-cart-add="${escapeHtml(product.id)}">
                                Añadir al carrito
                            </button>
                        </div>
                    </div>
                    ${create360ViewerMarkup(product)}
                    <section class="product-detail__section" aria-labelledby="gallery-title">
                        <h2 id="gallery-title">Galería</h2>
                        <p>Explora las imágenes disponibles del producto.</p>
                        <div class="product-detail__gallery">${galleryMarkup}</div>
                    </section>
                </article>
            `;

            const viewer = content.querySelector("[data-product-360-viewer]");
            if (viewer) {
                initialize360Viewer(viewer, product);
            }
        }
    }
}
