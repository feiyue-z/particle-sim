// ENUMERATION

export const particleType = Object.freeze( {
    BUBBLE: "bubble",
    CONFETTI: "confetti",
    BALL: "ball"
} );

export const visualizationMode = Object.freeze( {
    CLASSIC: "classic",
    TAPE: "tape",
    NEON: "neon"
} );

// GLOBAL SETTING

export const emitterSettings = {
    rate: 10.0,
    spread: 0.0,
    type: particleType.BUBBLE
};

export const particleParams = {
    [ particleType.BUBBLE ]: {
        mass: 0.03,
        gravity: 2.0,
        jitterFactor: 0.1,
        drag: 0.1
    },
    [ particleType.CONFETTI ]: {
        mass: 0.5,
        gravity: -9.8,
        jitterFactor: 0.0,
        drag: 0.0
    },
    [ particleType.BALL ]: {
        mass: 100.0,
        gravity: -9.8,
        jitterFactor: 0.0,
        drag: 0.0
    }
};

export const visualizationSettings = {
    mode: visualizationMode.CLASSIC,
    animation: false
}

// GLOBAL VARIABLE

export const clickables = [];