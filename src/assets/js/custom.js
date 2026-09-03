/***********************************************************************
 * File loader: Featured Collections
 ***********************************************************************/

const featuredCollectionsScript = document.createElement("script");

featuredCollectionsScript.src = new URL(
    "featured-collections.js",
    document.currentScript.src
).href;

document.head.appendChild(featuredCollectionsScript);


/***********************************************************************
 * File loader: Homepage Carousel
 ***********************************************************************/

const carouselHomeScript = document.createElement("script");

carouselHomeScript.src = new URL(
    "carousel-home.js",
    document.currentScript.src
).href;

document.head.appendChild(carouselHomeScript);


/***********************************************************************
 * File loader: Homepage Information Section
 ***********************************************************************/

const informationSectionScript =
    document.createElement("script");

informationSectionScript.src = new URL(
    "custom-information-section.js",
    document.currentScript.src
).href;

document.head.appendChild(informationSectionScript);


/***********************************************************************
 * File loader: ETH Skip-Link
 ***********************************************************************/

const ethSkipLinkScript = document.createElement("script");

ethSkipLinkScript.src = new URL(
    "eth-skip-link.js",
    document.currentScript.src
).href;

document.head.appendChild(ethSkipLinkScript);
