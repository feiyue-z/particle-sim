// ENUMERATION

export const ParticleType = Object.freeze( {
    BUBBLE: "bubble",
    CONFETTI: "confetti",
    BALL: "ball"
} );

export const VisualizationMode = Object.freeze( {
    CLASSIC: "classic",
    TAPE: "tape",
    NEON: "neon"
} );

// GLOBAL SETTING

export const EmitterSettings = {
    rate: 5.0,
    spread: 0.0,
    type: ParticleType.BUBBLE
};

export const ParticleParams = {
    [ ParticleType.BUBBLE ]: {
        mass: 0.03,
        gravity: 2.0,
        jitterFactor: 0.1,
        drag: 0.1
    },
    [ ParticleType.CONFETTI ]: {
        mass: 0.5,
        gravity: -9.8,
        jitterFactor: 0.0,
        drag: 0.0
    },
    [ ParticleType.BALL ]: {
        mass: 100.0,
        gravity: -9.8,
        jitterFactor: 0.0,
        drag: 0.0
    }
};

export const VisualizationSettings = {
    mode: VisualizationMode.CLASSIC,
    animation: false
}

// GLOBAL VARIABLE

export const clickables = [];