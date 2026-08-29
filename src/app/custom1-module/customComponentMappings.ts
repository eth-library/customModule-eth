import { EthConnectedpapersComponent } from '../eth-connectedpapers/eth-connectedpapers.component';
import { EthMatomoComponent } from '../eth-matomo/eth-matomo.component';
import { EthFullDisplaySideBarAfterComponent } from '../eth-full-display-side-bar-after/eth-full-display-side-bar-after.component';
import { EthRegistrationLinkComponent } from '../eth-registration-link/eth-registration-link.component';
import { EthChangeAddressComponent } from '../eth-change-address/eth-change-address.component';
import { EthIdpWarningComponent } from '../eth-idp-warning/eth-idp-warning.component';
import { EthRecordAvailabilityAfterComponent } from '../eth-record-availability-after/eth-record-availability-after.component';
import { EthLocationPageComponent } from '../eth-location-page/eth-location-page.component';
import { EthPersonPageComponent } from '../eth-person-page/eth-person-page.component';
import { EthViewItAfterComponent } from '../eth-view-it-after/eth-view-it-after.component';
import { EthIllLinkComponent } from '../eth-ill-link/eth-ill-link.component';
import { EthRequestHintsComponent } from '../eth-request-hints/eth-request-hints.component';
import { EthChatComponent } from '../eth-chat/eth-chat.component';



// Define the map
export const selectorComponentMap = new Map<string, any>([
    ['nde-app-layout-after',EthMatomoComponent],
    ['nde-view-it-after', EthViewItAfterComponent],
    ['nde-record-citations-indicators-top',EthConnectedpapersComponent],
    ['nde-record-availability-bottom', EthRecordAvailabilityAfterComponent],
    ['nde-entity-layout-bottom', EthPersonPageComponent],
    ['nde-entity-layout-after', EthLocationPageComponent],
    ['nde-login-form-content-bottom', EthRegistrationLinkComponent],
    ['nde-full-display-side-bar-bottom', EthFullDisplaySideBarAfterComponent],
    ['nde-personal-details-info-after', EthChangeAddressComponent],
    ['nde-personal-settings-before', EthIdpWarningComponent],
    ['nde-requests-top', EthIdpWarningComponent],
    ['nde-requests-after', EthIllLinkComponent],
    ['nde-base-request-form-top', EthRequestHintsComponent],
    ['nde-footer-after', EthChatComponent]
])


