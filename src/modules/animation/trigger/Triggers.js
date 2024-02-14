import AutoTimerTrigger from "./AutoTimer.js";
import { ForwardOnlyTrigger, BidirectionalTrigger } from "./KeyboardEvent.js";


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    forwardOnly: new ForwardOnlyTrigger(),
    bidirectional: new BidirectionalTrigger(),
    default: defaultTrigger
};
