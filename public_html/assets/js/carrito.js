"use strict";

(() => {
    const STORAGE_KEY = "karenBeauty.cart.v1";
    const MAX_QUANTITY = 99;
    const WHATSAPP_BUSINESS_NUMBER = "573112617515";
    const products = window.KAREN_BEAUTY_DEMO_PRODUCTS;
    const productMap = new Map(
        Array.isArray(products) ? products.map((product) => [product.id, product]) : []
    );
    const status = document.querySelector("[data-cart-status]");
    const cartContent = document.querySelector("[data-cart-content]");
    let cartItems = [];
    let storageReady = true;

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

    const formatAmount = (amount) => new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        currencyDisplay: "code",
        maximumFractionDigits: 0
    }).format(amount);

    const formatWhatsAppAmount = (amount) => `$${new Intl.NumberFormat("es-CO", {
        maximumFractionDigits: 0
    }).format(amount)}`;

    const setStatus = (message) => {
        if (status) {
            status.textContent = message;
        }
    };

    const getConfirmedPrice = (product) => {
        if (
            !product
            || product.isDemo !== false
            || product.priceConfirmed !== true
            || !Number.isFinite(product.commercialPrice)
            || product.commercialPrice < 0
        ) {
            return null;
        }

        return product.commercialPrice;
    };

    const getWhatsAppPrice = (product) => {
        const confirmedPrice = getConfirmedPrice(product);
        if (confirmedPrice !== null) {
            return { amount: confirmedPrice, isDemo: false };
        }

        if (
            product
            && product.isDemo === true
            && Number.isFinite(product.price)
            && product.price >= 0
        ) {
            return { amount: product.price, isDemo: true };
        }

        return null;
    };

    const readCart = () => {
        try {
            const storedValue = window.sessionStorage.getItem(STORAGE_KEY);
            if (!storedValue) {
                return [];
            }

            const parsed = JSON.parse(storedValue);
            if (!Array.isArray(parsed)) {
                throw new TypeError("El formato almacenado del carrito no es válido.");
            }

            const quantities = new Map();
            parsed.forEach((item) => {
                if (
                    item
                    && typeof item.id === "string"
                    && productMap.has(item.id)
                    && Number.isInteger(item.quantity)
                    && item.quantity >= 1
                    && item.quantity <= MAX_QUANTITY
                ) {
                    quantities.set(item.id, Math.min(
                        MAX_QUANTITY,
                        (quantities.get(item.id) || 0) + item.quantity
                    ));
                }
            });

            return Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
        } catch (error) {
            storageReady = false;
            setStatus("No se pudo leer el carrito de esta pestaña. Se iniciará vacío; revisa el almacenamiento del navegador.");
            return [];
        }
    };

    const saveCart = () => {
        if (!storageReady) {
            return false;
        }

        try {
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
            return true;
        } catch (error) {
            storageReady = false;
            setStatus("No se pudo guardar el carrito en esta pestaña. Revisa el almacenamiento disponible del navegador.");
            document.querySelectorAll("[data-cart-add]").forEach((button) => {
                button.disabled = true;
            });
            return false;
        }
    };

    const getPhotoUrl = (product) => {
        if (!product || product.isDemo !== false || !Array.isArray(product.photos)) {
            return "";
        }

        const photo = product.photos.find((item) => item && typeof item.src === "string");
        if (!photo) {
            return "";
        }

        try {
            const url = new URL(photo.src, window.location.href);
            return url.origin === window.location.origin
                && (url.protocol === "http:" || url.protocol === "https:")
                ? url.href
                : "";
        } catch (error) {
            return "";
        }
    };

    const getCartLines = () => cartItems
        .map((item) => ({
            product: productMap.get(item.id),
            quantity: item.quantity
        }))
        .filter((item) => item.product);

    const getCartCount = () => cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const ensureFloatingCart = () => {
        if (document.querySelector("[data-cart-floating]")) {
            return;
        }

        document.body.classList.add("has-cart-floating");
        document.body.insertAdjacentHTML("beforeend", `
            <a class="cart-floating" href="carrito.php" data-cart-floating>
                <svg class="cart-floating__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M2.5 3.5h2.2l2.1 11.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4l2-7.1H6.1M9 20a1.1 1.1 0 1 0 0-2.2A1.1 1.1 0 0 0 9 20Zm8.5 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"></path>
                </svg>
                <span class="cart-floating__count" data-cart-count aria-hidden="true">0</span>
                <span class="cart-floating__label">Abrir carrito</span>
            </a>
        `);
    };

    const updateCartIndicators = () => {
        ensureFloatingCart();

        const count = getCartCount();
        document.querySelectorAll("[data-cart-count]").forEach((element) => {
            element.textContent = String(count);
            if (element.matches(".cart-floating__count")) {
                element.parentElement.setAttribute(
                    "aria-label",
                    `Abrir carrito, ${count} ${count === 1 ? "unidad" : "unidades"}`
                );
            } else {
                element.setAttribute("aria-label", `${count} ${count === 1 ? "artículo" : "artículos"} en el carrito`);
            }
        });
    };

    const createWhatsAppMessage = (lines) => {
        const isDemoOrder = lines.some(({ product }) => product.isDemo === true);
        const messageLines = [
            isDemoOrder
                ? "PEDIDO DE PRUEBA — precios demostrativos no comerciales."
                : "Hola, Karen Beauty. Quiero realizar el siguiente pedido:",
            ...(isDemoOrder ? ["Este mensaje y sus valores son solo para pruebas; no representan precios comerciales ni un pedido pagadero."] : []),
            "",
            isDemoOrder
                ? "Hola, Karen Beauty. Quiero probar el siguiente pedido:"
                : null,
            ""
        ].filter((line) => line !== null);
        const shippingCost = 5000;
        let allOrderDetailsAvailable = true;
        let productsSubtotal = 0;

        lines.forEach(({ product, quantity }) => {
            const price = getWhatsAppPrice(product);
            const brandIsAvailable = (product.isDemo === false || product.isDemo === true)
                && typeof product.brand === "string"
                && product.brand.trim() !== "";

            if (!brandIsAvailable || price === null) {
                allOrderDetailsAvailable = false;
            }
            if (price !== null) {
                productsSubtotal += price.amount * quantity;
            }

            const brand = brandIsAvailable
                ? `${product.brand.trim()}${product.isDemo === true ? " (demostración)" : ""}`
                : "Pendiente de confirmar";
            const unitPrice = price === null
                ? "Pendiente de confirmar"
                : `${formatWhatsAppAmount(price.amount)}${price.isDemo ? " (demostrativo, no comercial)" : ""}`;
            messageLines.push(
                `• ${product.name} — Marca: ${brand} — Cantidad: ${quantity} — Precio unitario: ${unitPrice}`
            );
        });

        messageLines.push("");
        if (allOrderDetailsAvailable && lines.length > 0) {
            messageLines.push(`${isDemoOrder ? "Subtotal demostrativo (no comercial)" : "Subtotal productos"}: ${formatWhatsAppAmount(productsSubtotal)}`);
            messageLines.push(`Envío: ${formatWhatsAppAmount(shippingCost)}`);
            messageLines.push(
                `${isDemoOrder ? "TOTAL DEMOSTRATIVO (NO PAGADERO)" : "TOTAL A PAGAR"}: ${formatWhatsAppAmount(productsSubtotal + shippingCost)}`
            );
        } else {
            messageLines.push(`${isDemoOrder ? "Subtotal demostrativo" : "Subtotal productos"}: Pendiente de confirmar`);
            messageLines.push(`Envío: ${formatWhatsAppAmount(shippingCost)}`);
            messageLines.push(
                `${isDemoOrder ? "TOTAL DEMOSTRATIVO (NO PAGADERO)" : "TOTAL A PAGAR"}: Pendiente de confirmar precios y datos comerciales`
            );
        }

        messageLines.push("");
        messageLines.push("Gracias.");
        return messageLines.join("\n");
    };

    const getWhatsAppUrl = (message) => {
        const phone = WHATSAPP_BUSINESS_NUMBER.replace(/\D/g, "");
        if (!message || !/^[1-9]\d{7,14}$/.test(phone)) {
            return "";
        }

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const renderCart = () => {
        updateCartIndicators();

        if (!cartContent) {
            return;
        }

        const lines = getCartLines();

        if (lines.length === 0) {
            cartContent.innerHTML = `
                <section class="cart-empty">
                    <h2>Tu carrito está vacío</h2>
                    <p>Primero agrega productos al carrito para preparar un mensaje por WhatsApp.</p>
                    <a class="button-link" href="catalogo.php">Ir al catálogo</a>
                </section>
            `;
            setStatus(storageReady ? "" : "No se pudo leer o guardar el carrito en el almacenamiento de esta pestaña.");
            return;
        }

        const hasNonCommercialProducts = lines.some(({ product }) => product.isDemo !== false);
        const hasPendingPrices = lines.some(({ product }) => getConfirmedPrice(product) === null);
        const totalIsConfirmed = !hasNonCommercialProducts && !hasPendingPrices;
        const confirmedLines = lines.filter(({ product }) => getConfirmedPrice(product) !== null);
        const confirmedSubtotal = confirmedLines.reduce((sum, { product, quantity }) => {
            const price = getConfirmedPrice(product);
            return sum + price * quantity;
        }, 0);
        const demoPricedLines = lines.filter(({ product }) => (
            product.isDemo === true
            && Number.isFinite(product.price)
            && product.price >= 0
        ));
        const demoSubtotal = demoPricedLines.reduce(
            (sum, { product, quantity }) => sum + product.price * quantity,
            0
        );
        const message = createWhatsAppMessage(lines);
        const whatsappUrl = getWhatsAppUrl(message);

        cartContent.innerHTML = `
            ${hasNonCommercialProducts ? `
                <p class="cart-demo-warning" role="note">
                    El carrito contiene productos de demostración o sin clasificación comercial confirmada.
                    Se identifican como demostrativos en la consulta y sus valores ficticios no se usan como precios comerciales.
                </p>
            ` : ""}
            <div class="cart-layout">
                <section class="cart-items" aria-label="Artículos del carrito">
                    ${lines.map(({ product, quantity }) => {
                        const price = getConfirmedPrice(product);
                        const photoUrl = getPhotoUrl(product);
                        const subtotal = price === null ? null : price * quantity;

                        return `
                            <article class="cart-item ${photoUrl ? "cart-item--with-photo" : ""}" data-cart-item="${escapeHtml(product.id)}">
                                ${photoUrl ? `
                                    <img
                                        class="cart-item__photo"
                                        src="${escapeHtml(photoUrl)}"
                                        alt="${escapeHtml(product.photos.find((photo) => photo.src === photoUrl)?.alt || product.name)}"
                                        loading="lazy"
                                    >
                                ` : ""}
                                <div class="cart-item__details">
                                    <h2 class="cart-item__name">${escapeHtml(product.name)}</h2>
                                    ${product.isDemo === true ? `
                                        <p class="cart-item__demo">Producto ficticio de demostración; no es un artículo comercial.</p>
                                    ` : product.isDemo !== false ? `
                                        <p class="cart-item__demo">Producto pendiente de validar como comercial.</p>
                                    ` : ""}
                                    <p class="cart-item__price">
                                        ${price === null
                                            ? "Precio comercial pendiente de confirmar"
                                            : `Precio unitario confirmado: ${formatAmount(price)}`}
                                    </p>
                                    <p class="cart-item__subtotal">
                                        ${subtotal === null
                                            ? "Subtotal comercial pendiente"
                                            : `Subtotal: ${formatAmount(subtotal)}`}
                                    </p>
                                </div>
                                <div class="cart-item__actions" aria-label="Cantidad y acciones">
                                    <div class="cart-quantity" aria-label="Cantidad">
                                        <button type="button" data-cart-decrease="${escapeHtml(product.id)}" aria-label="Disminuir cantidad">−</button>
                                        <output data-cart-quantity="${escapeHtml(product.id)}" aria-live="polite">${quantity}</output>
                                        <button type="button" data-cart-increase="${escapeHtml(product.id)}" aria-label="Aumentar cantidad" ${quantity >= MAX_QUANTITY ? "disabled" : ""}>+</button>
                                    </div>
                                    <button class="cart-item__remove" type="button" data-cart-remove="${escapeHtml(product.id)}">
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        `;
                    }).join("")}
                </section>
                <aside class="cart-summary" aria-labelledby="cart-summary-title">
                    <h2 id="cart-summary-title">Resumen</h2>
                    ${confirmedLines.length > 0 && !totalIsConfirmed ? `
                        <p class="cart-summary__confirmed-subtotal">
                            Subtotal de productos con precio confirmado: ${formatAmount(confirmedSubtotal)}
                        </p>
                    ` : ""}
                    ${hasPendingPrices && !hasNonCommercialProducts ? `
                        <p class="cart-summary__notice">
                            ${lines.filter(({ product }) => getConfirmedPrice(product) === null).length}
                            producto(s) sin precio confirmado; su importe no se suma.
                        </p>
                    ` : ""}
                    <p class="cart-summary__total">
                        ${totalIsConfirmed
                            ? `Total: ${formatAmount(confirmedSubtotal)}`
                            : "Total comercial pendiente de confirmar"}
                    </p>
                    ${demoPricedLines.length > 0 ? `
                        <p class="cart-summary__notice" role="note">
                            <strong>Suma demostrativa (no pagadera): ${formatAmount(demoSubtotal)}</strong><br>
                            Calculada con valores ficticios del catálogo. No es un precio comercial ni un valor a pagar.
                            ${demoPricedLines.length < lines.filter(({ product }) => product.isDemo === true).length
                                ? " Se excluyen productos sin valor demostrativo válido."
                                : ""}
                        </p>
                    ` : ""}
                    ${hasNonCommercialProducts ? `
                        <p class="cart-summary__notice">
                            Los productos demostrativos o no identificados como comerciales no se incluyen en pedidos.
                        </p>
                    ` : ""}
                    ${hasPendingPrices && !hasNonCommercialProducts ? `
                        <p class="cart-summary__notice">
                            Se omiten los valores no confirmados. El total comercial queda pendiente.
                        </p>
                    ` : ""}
                    <div class="cart-whatsapp">
                        <h3>Preparar mensaje por WhatsApp</h3>
                        ${hasNonCommercialProducts ? `
                            <p>Esta consulta de prueba identifica claramente los productos demostrativos o pendientes de validar.</p>
                        ` : ""}
                        <p class="cart-whatsapp__preview">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
                        ${whatsappUrl ? `
                            <a class="cart-whatsapp__button" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer">
                                Enviar pedido por WhatsApp
                            </a>
                        ` : `
                            <p class="cart-whatsapp__notice">
                                Falta configurar un número comercial válido de WhatsApp. No se ha generado un enlace de envío.
                            </p>
                        `}
                    </div>
                    <a class="cart-summary__continue" href="catalogo.php">Seguir explorando</a>
                </aside>
            </div>
        `;
        setStatus(storageReady ? "" : "El carrito se muestra temporalmente, pero el navegador no pudo guardar los cambios.");
    };

    const commitCart = (nextItems, message) => {
        cartItems = nextItems;
        if (saveCart()) {
            setStatus(message);
        }
        renderCart();
    };

    document.addEventListener("click", (event) => {
        const addButton = event.target.closest("[data-cart-add]");
        if (addButton) {
            if (!storageReady) {
                setStatus("No se puede añadir el producto porque el almacenamiento de esta pestaña no está disponible.");
                return;
            }

            const id = addButton.dataset.cartAdd;
            if (!productMap.has(id)) {
                setStatus("No se encontró el producto seleccionado en el catálogo.");
                return;
            }

            const existing = cartItems.find((item) => item.id === id);
            if (existing && existing.quantity >= MAX_QUANTITY) {
                setStatus(`La cantidad máxima por producto es ${MAX_QUANTITY}.`);
                return;
            }

            const nextItems = existing
                ? cartItems.map((item) => item.id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item)
                : [...cartItems, { id, quantity: 1 }];

            commitCart(nextItems, "Producto añadido al carrito de esta pestaña.");
            return;
        }

        const decreaseButton = event.target.closest("[data-cart-decrease]");
        const increaseButton = event.target.closest("[data-cart-increase]");
        const removeButton = event.target.closest("[data-cart-remove]");

        if (!decreaseButton && !increaseButton && !removeButton) {
            return;
        }

        if (!storageReady) {
            setStatus("No se puede actualizar el carrito porque el almacenamiento de esta pestaña no está disponible.");
            return;
        }

        const id = (decreaseButton || increaseButton || removeButton).dataset.cartDecrease
            || (decreaseButton || increaseButton || removeButton).dataset.cartIncrease
            || (decreaseButton || increaseButton || removeButton).dataset.cartRemove;
        const current = cartItems.find((item) => item.id === id);

        if (!current) {
            return;
        }

        if (removeButton || (decreaseButton && current.quantity === 1)) {
            commitCart(cartItems.filter((item) => item.id !== id), "Producto eliminado del carrito.");
            return;
        }

        const delta = increaseButton ? 1 : -1;
        const updatedQuantity = Math.min(MAX_QUANTITY, Math.max(1, current.quantity + delta));
        if (updatedQuantity === current.quantity) {
            setStatus(`La cantidad debe estar entre 1 y ${MAX_QUANTITY}.`);
            return;
        }

        commitCart(cartItems.map((item) => item.id === id
            ? { ...item, quantity: updatedQuantity }
            : item), "Cantidad del carrito actualizada.");
    });

    try {
        cartItems = readCart();
    } catch (error) {
        storageReady = false;
        setStatus("No se pudo inicializar el almacenamiento del carrito en esta pestaña.");
    }

    ensureFloatingCart();

    document.querySelectorAll("[data-cart-add]").forEach((button) => {
        button.disabled = !storageReady;
    });

    renderCart();
    window.addEventListener("pageshow", () => {
        cartItems = readCart();
        renderCart();
    });
})();
