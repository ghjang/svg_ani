import AutoTimerTrigger from "./AutoTimer.js";
import {
    VerticalTrigger
    , ForwardOnlyTrigger
    , BidirectionalTrigger
} from "./KeyboardEvent.js";


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    vertical: new VerticalTrigger(),
    forwardOnly: new ForwardOnlyTrigger(),
    bidirectional: new BidirectionalTrigger(),
    default: defaultTrigger
};
