import * as THREE from 'three';

import { emitterSettings, particleType, particleParams } from './global';
import { addPath, initVisualization } from './visualization';
import BubbleParticle from './particles/bubbleParticle';
import ConfettiParticle from './particles/confettiParticle';
import ballParticle from './particles/ballParticle';

const bounceBack = -0.4; // Bounce back factor for collision
const timeStep = 1 / 3;

let _scene = null;
let particles = [];
let emissionAccumulator = 0;
let visualizationPending = false;

export function initSimulation( scene ) {
    _scene = scene;
}

export function updateSimulation( dt ) {
    updateParticles( dt );

    if ( visualizationPending && particles.length === 0 ) {
        visualizationPending = false;
        initVisualization( _scene );
    }
}

export function spawnParticles( dt, emitPos ) {
    visualizationPending = true;

    emissionAccumulator += emitterSettings.rate * dt;
    while ( emissionAccumulator >= timeStep ) {
        spawnParticle( emitPos );
        emissionAccumulator -= timeStep;
    }
}

function spawnParticle( emitPos ) {
    const spread = new THREE.Vector3(
        ( Math.random() - 0.5 ) * 0.5 * emitterSettings.spread,
        0,
        ( Math.random() - 0.5 ) * 0.5 * emitterSettings.spread
    );
    emitPos.add( spread );

    let p;
    const initVelocity = generateRandomVelocity( 30, 60, 1, 2, 0, 1 );
    
    switch ( emitterSettings.type ) {
        case particleType.BUBBLE:
            p = new BubbleParticle( emitPos, initVelocity );
            break;
        case particleType.CONFETTI:
            p = new ConfettiParticle( emitPos, initVelocity );
            break;
        case particleType.BALL:
            p = new ballParticle( emitPos, initVelocity );
            break;
    }

    _scene.add( p );
    particles.push( p );
}

function updateParticles( dt ) {
    for ( let i = particles.length - 1; i >= 0; i-- ) {
        const p = particles[ i ];
        p.age++;
      
        // Kill if lifetime exceeds
        if ( p.age == p.lifetime )  {
            // Add path for visualization
            addPath( p.path );

            // Swap and pop
            particles[ i ] = particles[ particles.length - 1 ];
            particles.pop();

            // Remove from scene
            _scene.remove( p );
            
            continue;
        }

        const { mass, gravity, jitterFactor, drag } = particleParams[ emitterSettings.type ];

        // Calculate air resistence (force produced by drag)
        const f_drag = p.velocity.clone().multiplyScalar( -drag );
        
        if ( p.angularVelocity ) {
            // Apply drag to angular velocity
            p.angularVelocity.multiplyScalar( 1 - drag * dt );

            // Update rotation
            const dr = p.angularVelocity.clone().multiplyScalar( dt );
            p.rotation.x += dr.x;
            p.rotation.y += dr.y;
            p.rotation.z += dr.z;

            if ( p.orbitCenter ) {
                // Get radial vector from center to particle
                const r = p.position.clone().sub( p.orbitCenter );

                // Calculate tangential velocity due to angular velocity
                const v_swirl = new THREE.Vector3().crossVectors( p.angularVelocity, r );

                // Add swirl to velocity
                p.velocity.add( v_swirl.multiplyScalar( dt ) );
            }
        }

        // Apply gravity and drag
        // a = f / m + g
        const g = new THREE.Vector3( 0, gravity, 0 );
        const a = g.clone().add( f_drag.multiplyScalar( 1 / mass ) );

        // Update velocity
        // Δv = a⋅Δt
        const dv = a.multiplyScalar( dt );
        p.velocity.add( dv );

        // Update position
        // Δp = v⋅Δt
        const dp = p.velocity.clone().multiplyScalar( dt );
        p.position.add( dp );

        // Apply jitter
        const jitter = new THREE.Vector3(
            ( Math.random() - 0.5 ) * 0.1 * jitterFactor,
            ( Math.random() - 0.5 ) * 0.1 * jitterFactor,
            ( Math.random() - 0.5 ) * 0.1 * jitterFactor
        );
        p.position.add( jitter );

        // Resolve collision
        const threshold = 0;
        if ( p.position.y <= threshold ) {
            p.position.y = threshold;
            p.velocity.y *= bounceBack;
        }

        p.path.push( p.position.clone() );
    }
}
  
// with random direction at XZ plane
function generateRandomVelocity( minAngle, maxAngle, minSpeed, maxSpeed, minY, maxY ) {
    const angle = randomInRange( minAngle, maxAngle ); // in radians
    const speed = randomInRange( minSpeed, maxSpeed );
    
    const vx = speed * Math.cos( angle );
    const vz = speed * Math.sin( angle ) ;
    const vy = randomInRange( minY, maxY ); // upward speed
    
    return new THREE.Vector3( vx, vy, vz );
}

function randomInRange( min, max ) {
    return Math.random() * ( max - min ) + min;
}