/***********************************************************************
 * ETH Skip-Link
 *
 * Der ETH-Header steht im DOM vor den Skip-Links von Primo. Ohne diesen
 * Button muessen Tastaturnutzende auf jeder Seite fuenf Breadcrumb-Links
 * durchtabben, bevor sie den ersten Umgehungsmechanismus erreichen.
 *
 * Der Button liegt als erstes Element in header_de.html bzw. header_en.html
 * und ist unsichtbar, bis er den Fokus bekommt.
 *
 * Warum ein Button und kein <a href="#...">: Angulars Router faengt
 * Fragment-Links ab und navigiert stattdessen weg. Am 2026-09-03 verifiziert.
 *
 * Sprungziel ist Primos eigener Skip-Block, nicht direkt der Inhalt. So
 * bleiben dessen Ziele ("Weiter zu Suchleiste", "Weiter zu Trefferliste")
 * erreichbar, statt uebersprungen zu werden.
 *
 * Siehe Audit 2026-09-02, Befund E3.
 ***********************************************************************/

(function () {
    "use strict";

    // In dieser Reihenfolge, erstes vorhandenes Ziel gewinnt.
    const ZIEL_SELEKTOREN = [
        "nde-skip-links button.skip-h2-button",
        "#main-search-bar"
    ];

    function findeZiel() {
        for (const selektor of ZIEL_SELEKTOREN) {
            const element =
                document.querySelector(selektor);

            if (element) {
                return element;
            }
        }

        return null;
    }

    // Delegiert, weil Primo den Header bei Navigationen neu einhaengen kann.
    document.addEventListener(
        "click",
        function (ereignis) {
            const ausloeser =
                ereignis.target instanceof Element
                    ? ereignis.target.closest(
                          "[data-eth-skip-link]"
                      )
                    : null;

            if (!ausloeser) {
                return;
            }

            ereignis.preventDefault();

            const ziel = findeZiel();

            if (!ziel) {
                return;
            }

            ziel.focus();
        }
    );
})();
