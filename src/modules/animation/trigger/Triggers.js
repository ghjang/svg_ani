import AutoTimerTrigger from "./AutoTimer.js";
import { createKeyboardTrigger } from "./KeyboardEvent.js";
import CompoundTrigger from "./Compound.js";


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    vertical: createKeyboardTrigger('vertical'),
    forwardOnly: createKeyboardTrigger('forwardOnly'),
    bidirectional: createKeyboardTrigger('bidirectional'),
    compound: new CompoundTrigger(),
    default: defaultTrigger
};
