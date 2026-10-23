"use strict";

const menuButton = document.querySelector(".menu-toggle");
const siteNavigation = document.querySelector("#site-navigation");

if (menuButton && siteNavigation) {
    document.documentElement.classList.add("menu-enhanced");

    const closeMenu = () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Abrir menú");
        siteNavigation.classList.remove("is-open");
    };

    menuButton.addEventListener("click", () => {
        const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isExpanded));
        menuButton.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
        siteNavigation.classList.toggle("is-open", !isExpanded);
    });

    siteNavigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 48rem)").matches) {
            closeMenu();
        }
    });
}
