/**
 * Hide virtual-browse carousel cards that use Primo placeholder icons
 * instead of real cover images.
 */
(function hideCarouselCardsWithoutCovers() {
    "use strict";

    /* Prevent duplicate observers if custom.js is initialized more than once */
    if (window.__ethCarouselCoverFilterInitialized) {
        return;
    }

    window.__ethCarouselCoverFilterInitialized = true;

    const imageSelector =
        ".carousel-card img.mat-mdc-card-image";

    const placeholderPattern =
        /\/assets\/images\/icon_[^/?#]+\.png(?:[?#].*)?$/i;

    function isPlaceholderImage(imageUrl) {
        if (placeholderPattern.test(imageUrl)) {
            return true;
        }

        try {
            const url = new URL(
                imageUrl,
                window.location.href
            );

            return (
                url.searchParams
                    .get("ignoreDefault")
                    ?.toLowerCase() === "true"
            );
        } catch {
            return imageUrl.includes(
                "ignoreDefault=true"
            );
        }
    }

    function processImage(image) {
        if (!(image instanceof HTMLImageElement)) {
            return;
        }

        const cardContainer =
            image.closest(".virtual-browse-card-container");

        if (!cardContainer) {
            return;
        }

        const imageUrl =
            image.currentSrc ||
            image.getAttribute("src") ||
            "";

        const isPlaceholder =
            isPlaceholderImage(imageUrl);

        if (isPlaceholder) {
            cardContainer.style.setProperty(
                "display",
                "none",
                "important"
            );
        } else {
            /*
             * Important for CDK Virtual Scroll:
             * Angular may reuse an existing card for another record.
             */
            cardContainer.style.removeProperty("display");
        }
    }

    function scan(root) {
        if (
            !root ||
            !(
                root instanceof Element ||
                root instanceof Document ||
                root instanceof DocumentFragment
            )
        ) {
            return;
        }

        if (
            root instanceof Element &&
            root.matches(imageSelector)
        ) {
            processImage(root);
        }

        root
            .querySelectorAll(imageSelector)
            .forEach(processImage);
    }

    function initialize() {
        scan(document);

        const observer =
            new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    /*
                     * React when an existing image receives a new src.
                     */
                    if (
                        mutation.type === "attributes" &&
                        mutation.target instanceof HTMLImageElement
                    ) {
                        processImage(mutation.target);
                        return;
                    }

                    /*
                     * React when Primo inserts new carousel cards.
                     */
                    mutation.addedNodes.forEach((node) => {
                        if (
                            node instanceof Element ||
                            node instanceof DocumentFragment
                        ) {
                            scan(node);
                        }
                    });
                });
            });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src"]
        });
    }

    if (document.body) {
        initialize();
    } else {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    }
})();