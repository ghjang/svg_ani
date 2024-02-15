import AutoTimerTrigger from "./AutoTimer.js";
import { createKeyboardTrigger } from "./KeyboardEvent.js";


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    vertical: createKeyboardTrigger('vertical'),
    forwardOnly: createKeyboardTrigger('forwardOnly'),
    bidirectional: createKeyboardTrigger('bidirectional'),
    composite: createKeyboardTrigger('composite'),
    default: defaultTrigger
};
