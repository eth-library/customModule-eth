/********************************* 
 * Featured Collection on Homepage
 *********************************/

(function () {
    "use strict";

    const CONFIG = {
        institution: "41SLSP_ETH",

        // API-Parameter userInst des Collections-Endpunkts, keine View.
        userInstitution: "41SLSP_ETH_NDE",

        // Die View-ID kommt aus der URL. Primo haelt die View ueber die
        // gesamte Sitzung; ist sie hart verlinkt, reisst ein Klick auf eine
        // Sammlungskarte die Nutzenden in eine andere View. Fallback ist
        // ETH_NDE, die ab Sommer 2027 produktive View.
        // Siehe Audit 2026-09-02, Befund E4.
        viewId:
            new URLSearchParams(
                window.location.search
            ).get("vid") ||
            "41SLSP_ETH:ETH_NDE",

        numberOfCollections: 4,

        collectionScopeUrl:
            "https://eth-library.github.io/snippets/primo/home-collections.json",

        /*
         * Auswahlmodus:
         *
         * "reload"
         * Bei jedem Laden der Homepage werden neue Collections gewählt.
         *
         * "session"
         * Die Auswahl bleibt während der aktuellen Browser-Sitzung stabil.
         *
         * "daily"
         * Die Auswahl wechselt einmal pro Kalendertag.
         * Alle Benutzer:innen sehen am selben Tag dieselbe Auswahl.
         */
        selectionMode: "reload",

        /*
         * false:
         * Die Section wird ausgeblendet, wenn die GitHub-Liste nicht
         * geladen werden kann.
         *
         * true:
         * Bei einem Fehler werden alle Collections als Auswahl verwendet.
         */
        fallbackToAllCollections: false
    };

    /**
     * Initialises the Featured Collections section.
     *
     * The homepage can be inserted asynchronously by Primo. A MutationObserver
     * therefore checks whether the section has appeared in the DOM.
     */
    function initialiseFeaturedCollections() {
        const section =
            document.getElementById("featured-collections");

        if (
            !section ||
            section.dataset.initialised === "true"
        ) {
            return;
        }

        section.dataset.initialised = "true";

        const language =
            section.dataset.language === "en"
                ? "en"
                : "de";

        const grid = section.querySelector(
            "[data-featured-collections-grid]"
        );

        if (!grid) {
            return;
        }

        renderLoadingState(grid, language);

        loadAndRenderCollections(
            section,
            grid,
            language
        );
    }

    async function loadAndRenderCollections(
        section,
        grid,
        language
    ) {
        try {
            /*
             * Scope configuration and Primo collection data can be
             * loaded in parallel.
             */
            const [
                scopeResult,
                collectionsResponse
            ] = await Promise.all([
                loadCollectionScope(),
                fetchCollections(language)
            ]);

            const rootCollections = Array.isArray(
                collectionsResponse?.data?.collection
            )
                ? collectionsResponse.data.collection
                : [];

            const allCollections =
                flattenCollections(rootCollections);

            const scopedCollections =
                filterCollectionsByScope(
                    allCollections,
                    scopeResult.collectionIds
                );

            const eligibleCollections =
                scopedCollections
                    .filter(isEligibleCollection)
                    .map((collection) =>
                        normaliseCollection(
                            collection,
                            language
                        )
                    );

            if (eligibleCollections.length === 0) {
                throw new Error(
                    "No eligible collections exist in the configured scope."
                );
            }

            const selectedCollections =
                selectCollectionsForCurrentMode(
                    eligibleCollections,
                    language,
                    CONFIG.numberOfCollections,
                    scopeResult.scopeSignature
                );

            renderCollections(
                grid,
                selectedCollections,
                language
            );

            grid.setAttribute(
                "aria-busy",
                "false"
            );
        } catch (error) {
            console.error(
                "Featured Collections could not be loaded:",
                error
            );

            section.hidden = true;
        }
    }

    /**
     * Loads the editorial list of permitted collection IDs.
     */
    async function loadCollectionScope() {
        try {
            const response = await fetch(
                CONFIG.collectionScopeUrl,
                {
                    method: "GET",
                    mode: "cors",
                    cache: "no-cache",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Collection scope request failed with status ${response.status}`
                );
            }

            const scopeData =
                await response.json();

            if (
                !scopeData ||
                !Array.isArray(
                    scopeData.collectionIds
                )
            ) {
                throw new Error(
                    'Collection scope JSON must contain a "collectionIds" array.'
                );
            }

            const collectionIds =
                normaliseCollectionIds(
                    scopeData.collectionIds
                );

            if (collectionIds.length === 0) {
                throw new Error(
                    "The collection scope contains no valid collection IDs."
                );
            }

            return {
                collectionIds,

                /*
                 * The signature changes whenever the configured IDs change.
                 */
                scopeSignature:
                    createScopeSignature(
                        collectionIds
                    )
            };
        } catch (error) {
            console.error(
                "Collection scope could not be loaded:",
                error
            );

            if (
                CONFIG.fallbackToAllCollections
            ) {
                console.warn(
                    "Falling back to all available collections."
                );

                return {
                    collectionIds: null,
                    scopeSignature: "all"
                };
            }

            throw error;
        }
    }

    /**
     * Normalises IDs and removes duplicates.
     */
    function normaliseCollectionIds(ids) {
        return [
            ...new Set(
                ids
                    .map((id) =>
                        String(id).trim()
                    )
                    .filter(Boolean)
            )
        ];
    }

    /**
     * Creates a stable signature for the current editorial scope.
     */
    function createScopeSignature(
        collectionIds
    ) {
        return collectionIds
            .slice()
            .sort()
            .join("-");
    }

    /**
     * Loads all collection data from Primo.
     */
    async function fetchCollections(language) {
        const endpoint =
            buildCollectionsEndpoint(language);

        const response = await fetch(
            endpoint,
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Collection request failed with status ${response.status}`
            );
        }

        return response.json();
    }

    function buildCollectionsEndpoint(
        language
    ) {
        const parameters =
            new URLSearchParams({
                name: "get_collections",
                useCache: "true",
                inst: CONFIG.institution,
                userInst:
                    CONFIG.userInstitution,
                lang: language
            });

        return (
            "/primaws/rest/priv/myaccount/collection?" +
            parameters.toString()
        );
    }

    /**
     * Flattens all hierarchy levels.
     *
     * Both node collections and collections containing records are included.
     */
    function flattenCollections(
        collections
    ) {
        const result = [];

        for (const collection of collections) {
            result.push(collection);

            const children =
                collection
                    ?.collections
                    ?.collection;

            if (Array.isArray(children)) {
                result.push(
                    ...flattenCollections(
                        children
                    )
                );
            }
        }

        return result;
    }

    /**
     * Limits the Primo response to the IDs configured on GitHub.
     *
     * If collectionIds is null, all collections are returned. This only
     * happens when fallbackToAllCollections is enabled.
     */
    function filterCollectionsByScope(
        collections,
        collectionIds
    ) {
        if (collectionIds === null) {
            return collections;
        }

        const allowedIds =
            new Set(collectionIds);

        return collections.filter(
            (collection) =>
                allowedIds.has(
                    String(
                        collection
                            ?.pid
                            ?.value || ""
                    )
                )
        );
    }

    /**
     * Returns the best available thumbnail URL.
     *
     * Priority:
     * 1. First entry from item_images.item_image array
     * 2. item_images.item_image string
     * 3. collection.thumbnail with "/1" appended
     */
    function buildThumbnailUrl(
        collection
    ) {
        const itemImage =
            collection
                ?.item_images
                ?.item_image;

        if (
            Array.isArray(itemImage) &&
            itemImage.length > 0 &&
            typeof itemImage[0] === "string" &&
            itemImage[0].trim()
        ) {
            return itemImage[0].trim();
        }

        if (
            typeof itemImage === "string" &&
            itemImage.trim()
        ) {
            return itemImage.trim();
        }

        const thumbnail =
            typeof collection?.thumbnail ===
                "string"
                ? collection.thumbnail.trim()
                : "";

        if (!thumbnail) {
            return "";
        }

        return thumbnail.endsWith("/1")
            ? thumbnail
            : `${thumbnail}/1`;
    }

    function isEligibleCollection(
        collection
    ) {
        return Boolean(
            collection?.pid?.value &&
            typeof collection.title ===
            "string" &&
            collection.title.trim() &&
            buildThumbnailUrl(collection)
        );
    }

    function normaliseCollection(
        collection,
        language
    ) {
        const id =
            String(collection.pid.value);

        return {
            id,

            title:
                collection.title.trim(),

            description:
                typeof collection.description ===
                    "string"
                    ? collection.description.trim()
                    : "",

            thumbnailUrl:
                buildThumbnailUrl(collection),

            url:
                buildCollectionPageUrl(
                    id,
                    language
                )
        };
    }

    /**
     * Adjust this function if the final NDE collection route differs.
     */
    function buildCollectionPageUrl(
        collectionId,
        language
    ) {
        const parameters =
            new URLSearchParams({
                vid: CONFIG.viewId,
                collectionId,
                lang: language
            });

        return (
            "/nde/collectionDiscovery?" +
            parameters.toString()
        );
    }

    /**
     * Chooses the appropriate selection strategy according to CONFIG.
     */
    function selectCollectionsForCurrentMode(
        collections,
        language,
        requestedCount,
        scopeSignature
    ) {
        const mode =
            normaliseSelectionMode(
                CONFIG.selectionMode
            );

        if (mode === "reload") {
            return selectRandomCollections(
                collections,
                requestedCount
            );
        }

        if (mode === "daily") {
            return selectDailyCollections(
                collections,
                language,
                requestedCount,
                scopeSignature
            );
        }

        return selectSessionCollections(
            collections,
            language,
            requestedCount,
            scopeSignature
        );
    }

    /**
     * Falls back to "session" if an unknown value was configured.
     */
    function normaliseSelectionMode(mode) {
        const validModes =
            new Set([
                "reload",
                "session",
                "daily"
            ]);

        if (validModes.has(mode)) {
            return mode;
        }

        console.warn(
            `Unknown selectionMode "${mode}". Falling back to "session".`
        );

        return "session";
    }

    /**
     * Session mode:
     * The selected IDs are stored in sessionStorage.
     */
    function selectSessionCollections(
        collections,
        language,
        requestedCount,
        scopeSignature
    ) {
        const storageKey =
            `eth-featured-collections-${language}`;

        const availableById =
            new Map(
                collections.map(
                    (collection) => [
                        collection.id,
                        collection
                    ]
                )
            );

        try {
            const storedValue =
                sessionStorage.getItem(
                    storageKey
                );

            if (storedValue) {
                const storedData =
                    JSON.parse(storedValue);

                const storedIds =
                    storedData?.collectionIds;

                const storedScopeSignature =
                    storedData?.scopeSignature;

                if (
                    Array.isArray(storedIds) &&
                    storedScopeSignature ===
                    scopeSignature
                ) {
                    const storedCollections =
                        storedIds
                            .map((id) =>
                                availableById.get(
                                    String(id)
                                )
                            )
                            .filter(Boolean);

                    if (
                        storedCollections.length ===
                        Math.min(
                            requestedCount,
                            collections.length
                        )
                    ) {
                        return storedCollections;
                    }
                }
            }
        } catch (error) {
            console.warn(
                "Stored Featured Collections could not be read:",
                error
            );
        }

        const selectedCollections =
            selectRandomCollections(
                collections,
                requestedCount
            );

        try {
            sessionStorage.setItem(
                storageKey,
                JSON.stringify({
                    scopeSignature,

                    collectionIds:
                        selectedCollections.map(
                            (collection) =>
                                collection.id
                        )
                })
            );
        } catch (error) {
            console.warn(
                "Featured Collections could not be stored:",
                error
            );
        }

        return selectedCollections;
    }

    /**
     * Daily mode:
     *
     * Creates a deterministic daily selection based on:
     * - current local date
     * - language
     * - configured scope
     *
     * No browser storage is required.
     */
    function selectDailyCollections(
        collections,
        language,
        requestedCount,
        scopeSignature
    ) {
        const dateKey =
            getLocalDateKey();

        const seedText = [
            dateKey,
            language,
            scopeSignature
        ].join("|");

        const seed =
            hashString(seedText);

        return selectSeededCollections(
            collections,
            requestedCount,
            seed
        );
    }

    /**
     * Returns the current local date as YYYY-MM-DD.
     */
    function getLocalDateKey() {
        const now = new Date();

        const year =
            String(now.getFullYear());

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    /**
     * Converts a string into a stable unsigned integer.
     */
    function hashString(value) {
        let hash = 2166136261;

        for (
            let index = 0;
            index < value.length;
            index += 1
        ) {
            hash ^= value.charCodeAt(index);

            hash = Math.imul(
                hash,
                16777619
            );
        }

        return hash >>> 0;
    }

    /**
     * Small deterministic pseudo-random number generator.
     */
    function createSeededRandom(seed) {
        let state =
            seed >>> 0;

        return function () {
            state += 0x6D2B79F5;

            let result = state;

            result = Math.imul(
                result ^ (result >>> 15),
                result | 1
            );

            result ^= result +
                Math.imul(
                    result ^ (result >>> 7),
                    result | 61
                );

            return (
                (
                    result ^
                    (result >>> 14)
                ) >>> 0
            ) / 4294967296;
        };
    }

    /**
     * Deterministic Fisher-Yates shuffle for daily mode.
     */
    function selectSeededCollections(
        collections,
        count,
        seed
    ) {
        const shuffledCollections =
            [...collections];

        const random =
            createSeededRandom(seed);

        for (
            let index =
                shuffledCollections.length - 1;
            index > 0;
            index -= 1
        ) {
            const randomIndex =
                Math.floor(
                    random() *
                    (index + 1)
                );

            [
                shuffledCollections[index],
                shuffledCollections[
                randomIndex
                ]
            ] = [
                    shuffledCollections[
                    randomIndex
                    ],
                    shuffledCollections[index]
                ];
        }

        return shuffledCollections.slice(
            0,
            Math.min(
                count,
                shuffledCollections.length
            )
        );
    }

    /**
     * Standard random Fisher-Yates shuffle.
     *
     * Used for reload and session mode.
     */
    function selectRandomCollections(
        collections,
        count
    ) {
        const shuffledCollections =
            [...collections];

        for (
            let index =
                shuffledCollections.length - 1;
            index > 0;
            index -= 1
        ) {
            const randomIndex =
                Math.floor(
                    Math.random() *
                    (index + 1)
                );

            [
                shuffledCollections[index],
                shuffledCollections[
                randomIndex
                ]
            ] = [
                    shuffledCollections[
                    randomIndex
                    ],
                    shuffledCollections[index]
                ];
        }

        return shuffledCollections.slice(
            0,
            Math.min(
                count,
                shuffledCollections.length
            )
        );
    }

    function renderLoadingState(
        grid,
        language
    ) {
        const loadingText =
            language === "en"
                ? "Loading collections…"
                : "Sammlungen werden geladen…";

        grid.replaceChildren();

        const loadingElement =
            document.createElement("p");

        loadingElement.className =
            "featured-collections-loading";

        loadingElement.textContent =
            loadingText;

        grid.appendChild(
            loadingElement
        );
    }

    function renderCollections(
        grid,
        collections,
        language
    ) {
        const fragment =
            document.createDocumentFragment();

        collections.forEach(
            (collection) => {
                fragment.appendChild(
                    createCollectionCard(
                        collection,
                        language
                    )
                );
            }
        );

        grid.replaceChildren(fragment);
    }

    function createCollectionCard(
        collection,
        language
    ) {
        // A11y: Die Karte ist ein div, nicht ein Link. Nur der Titel ist verlinkt,
        // ein CSS-Overlay macht die ganze Karte klickbar. Vorher war die gesamte
        // Karte ein <a>, wodurch Titel, Beschreibung und CTA zu einem einzigen
        // Linknamen verklebten und die Linkliste des Screenreaders unbrauchbar
        // wurde. Siehe Audit 2026-09-02, Befund E2.
        const card =
            document.createElement("div");

        card.className =
            "featured-collection-card";

        const imageWrapper =
            document.createElement("div");

        imageWrapper.className =
            "featured-collection-image-wrapper";

        const image =
            document.createElement("img");

        image.className =
            "featured-collection-image";

        image.src =
            collection.thumbnailUrl;

        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener(
            "error",
            () => {
                imageWrapper.hidden = true;
            }
        );

        imageWrapper.appendChild(
            image
        );

        const content =
            document.createElement("div");

        content.className =
            "featured-collection-content";

        const title =
            document.createElement("h3");

        title.className =
            "featured-collection-card-title mat-title-large";

        const titleLink =
            document.createElement("a");

        titleLink.className =
            "featured-collection-card-link";

        titleLink.href = collection.url;

        titleLink.textContent =
            collection.title;

        title.appendChild(titleLink);

        const description =
            document.createElement("p");

        description.className =
            "featured-collection-description mat-body-medium";

        description.textContent =
            collection.description;

        const linkLabel =
            document.createElement("span");

        linkLabel.className =
            "featured-collection-link-label";

        const linkLabelText =
            document.createElement("span");

        linkLabelText.className =
            "featured-collection-link-label-text";

        linkLabelText.textContent =
            language === "en"
                ? "Explore collection"
                : "Sammlung entdecken";

        linkLabel.appendChild(linkLabelText);

        content.appendChild(title);

        if (collection.description) {
            content.appendChild(
                description
            );
        }

        content.appendChild(
            linkLabel
        );

        card.appendChild(
            imageWrapper
        );

        card.appendChild(
            content
        );

        return card;
    }

    initialiseFeaturedCollections();

    const observer =
        new MutationObserver(() => {
            initialiseFeaturedCollections();
        });

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );
})();