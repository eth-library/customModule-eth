/***********************************************************************
 * Random image for homepage information section
 ***********************************************************************/

(function () {
    "use strict";

    const IMAGE_PATH =
        "/nde/custom/41SLSP_ETH-ETH_NDE3/assets/images/intro-home/";

    const NUMBER_OF_IMAGES = 7;

    const STORAGE_KEY =
        "eth-home-last-intro-image";

    function setRandomIntroImage() {
        const image = document.querySelector(
            "[data-random-intro-image]"
        );

        if (!image || image.dataset.randomImageInitialised === "true") {
            return;
        }

        image.dataset.randomImageInitialised = "true";

        const previousImageNumber =
            Number(sessionStorage.getItem(STORAGE_KEY));

        let imageNumber;

        do {
            imageNumber =
                Math.floor(Math.random() * NUMBER_OF_IMAGES) + 1;
        } while (
            NUMBER_OF_IMAGES > 1 &&
            imageNumber === previousImageNumber
        );

        image.src =
            `${IMAGE_PATH}${imageNumber}.jpg`;

        sessionStorage.setItem(
            STORAGE_KEY,
            String(imageNumber)
        );
    }

    setRandomIntroImage();

    const observer =
        new MutationObserver(() => {
            setRandomIntroImage();
        });

    observer.observe(
        document.documentElement,
        {
            childList: true,
            subtree: true
        }
    );
})();