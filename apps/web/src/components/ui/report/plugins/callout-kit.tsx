import { BaseCalloutPlugin } from '@platejs/callout';

import { CalloutElement } from '../elements/CalloutNode';

export const CalloutKit = [BaseCalloutPlugin.withComponent(CalloutElement)];
