import { EthConnectedpapersComponent } from '../eth-connectedpapers/eth-connectedpapers.component';
import { EthGitHintComponent } from '../eth-git-hint/eth-git-hint.component';
import { EthMatomoComponent } from '../eth-matomo/eth-matomo.component';
import { EthLocationAfterComponent } from '../eth-location-after/eth-location-after.component';
import { EthFullDisplaySideBarAfterComponent } from '../eth-full-display-side-bar-after/eth-full-display-side-bar-after.component';
import { EthBibNewsComponent } from '../eth-bib-news/eth-bib-news.component';
import { EthRegistrationLinkComponent } from '../eth-registration-link/eth-registration-link.component';
import { EthLogoSublineComponent } from '../eth-logo-subline/eth-logo-subline.component';
import { EthChangeAdressComponent } from '../eth-change-adress/eth-change-adress.component';
import { EthIdpWarningComponent } from '../eth-idp-warning/eth-idp-warning.component';
import { EthRecordAvailabilityAfterComponent } from '../eth-record-availability-after/eth-record-availability-after.component';
import { EthPlacePageComponent } from '../eth-place-page/eth-place-page.component';
import { EthPersonPageComponent } from '../eth-person-page/eth-person-page.component';
//import { EthOKMComponent } from '../eth-okm/eth-okm.component';
//import { EthProvenienzEraraLinkComponent } from '../eth-provenienz-erara-link/eth-provenienz-erara-link.component';
import { EthGetitLocationsfilterComponent } from '../eth-getit-locationsfilter/eth-getit-locationsfilter.component';
import { EthViewItAfterComponent } from '../eth-view-it-after/eth-view-it-after.component';
//import { EthMetagridComponent } from '../eth-metagrid/eth-metagrid.component'
import { EthOffcampusWarningComponent } from '../eth-offcampus-warning/eth-offcampus-warning.component';
import { EthIllLinkComponent } from '../eth-ill-link/eth-ill-link.component';

// Define the map
export const selectorComponentMap = new Map<string, any>([
    ['nde-landing-page-bottom', EthBibNewsComponent],
    ['nde-app-layout-before',EthGitHintComponent],
    ['nde-app-layout-after',EthMatomoComponent],
    ['nde-logo-bottom', EthLogoSublineComponent],
    ['nde-view-it-before', EthOffcampusWarningComponent],
    ['nde-view-it-after', EthViewItAfterComponent],
    //['nde-full-display-links-top', EthProvenienzEraraLinkComponent],
    //['nde-online-availability-before', EthConnectedpapersComponent],
    ['nde-record-citations-indicators-top',EthConnectedpapersComponent],
    ['nde-record-availability-after', EthRecordAvailabilityAfterComponent],
    ['nde-search-results-container-after', EthPlacePageComponent],
    ['nde-entity-layout-bottom', EthPersonPageComponent],
    ['nde-get-it-after',EthGetitLocationsfilterComponent],
    ['nde-location-after', EthLocationAfterComponent],
    //['nde-login-dialog-after', EthRegistrationLinkComponent],
    ['nde-login-form-content-bottom', EthRegistrationLinkComponent],
    ['nde-full-display-side-bar-bottom', EthFullDisplaySideBarAfterComponent],
    ['nde-personal-details-view-after', EthChangeAdressComponent],
    ['nde-personal-settings-before', EthIdpWarningComponent],
    ['nde-requests-after', EthIllLinkComponent],
    //['nde-search-bar-presenter-after', EthOKMComponent],
    //['nde-full-display-details-bottom', EthMetagridComponent],
])


