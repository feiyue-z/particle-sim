import * as THREE from 'three';

import FakeGlowMaterial from './particles/glowMaterial';
import { VisualizationSettings, VisualizationMode } from './global';

const paths = [];
const conePaths = [];
const glowPaths = [];
const tapePaths = [];
const speed = 0.0001;

const objects = new THREE.Group();
const trajectoryObjects = new THREE.Group();
const coneObjects = new THREE.Group();
const tapeObjects = new THREE.Group();
const glowObjects = new THREE.Group();

let _scene = null;

export function initVisualization( scene ) {
    _scene = scene;

    // Clean objects from last session
    if ( objects.children.length !== 0) {
        trajectoryObjects.clear();
        coneObjects.clear();
        tapeObjects.clear();
        glowObjects.clear();

        scene.remove( objects );
    }

    // console.log(`pathsData.length = ${ paths.length }`)

    // Visualize last MAX_PATH paths
    const MAX_PATH = 30;
    for ( let i = Math.max( 0, paths.length - MAX_PATH); i < paths.length; i++ ) {
        const path = paths[ i ];

        const color = getRandomColor();
        const curve = new THREE.CatmullRomCurve3( path );

        const trajectory = createTrajectory( path, color );
        const cones = createCones( curve, color );
        trajectoryObjects.add( trajectory );
        coneObjects.add( cones );
        conePaths.push( { curve, cones } );

        const tape = createTape( curve, color );
        tapeObjects.add( tape.mesh );
        tapePaths.push( tape );

        const glows = createGlowSpheres( curve, getDarkenColor( color ) );
        glowObjects.add( glows );
        glowPaths.push( { curve, glows } );
    }

    // Add visualization objects to scene
    addObjectsToScene();

    // Clean raw path data of current session
    paths.length = 0;
}

export function addPath( path ) {
    paths.push( path );
}

export function addObjectsToScene() {
    if ( !_scene ) return;

    objects.clear();

    const { mode } = VisualizationSettings;
    switch( mode ) {
        case VisualizationMode.CLASSIC:
            if ( trajectoryObjects != null && coneObjects != null ) {
                objects.add( trajectoryObjects );
                objects.add( coneObjects );
            }
            break;
        case VisualizationMode.TAPE:
            if ( tapeObjects != null ) {
                objects.add( tapeObjects );
            }
            break;
        case VisualizationMode.NEON:
            if ( glowObjects != null ) {
                objects.add( glowObjects );
            }
            break;
    }

    _scene.add( objects );
}

export function animatePath() {
    const { mode, animation } = VisualizationSettings;
    if ( !animation ) return;

    switch( mode ) {
        case VisualizationMode.CLASSIC:
            animateClassic();
            break;
        case VisualizationMode.TAPE:
            animateTape();
            break;
        case VisualizationMode.NEON:
            animateGlow();
            break;
    }
}

function animateClassic() {
    conePaths.forEach( ( { curve, cones } ) => {
        const count = cones.count;
        const dummy = new THREE.Object3D();

        for ( let i = 0; i < count; i++ ) {
            // Increment t
            let t = cones.userData.ts[ i ];
            t += speed;
            if ( t >= 1 ) t--;
            cones.userData.ts[ i ] = t;

            // Position and direction at new t
            const pos = curve.getPoint( t );
            const dir = curve.getTangent( t ).normalize();

            const quat = new THREE.Quaternion();
            quat.setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), dir );

            dummy.position.copy( pos );
            dummy.quaternion.copy( quat );
            dummy.updateMatrix();

            cones.setMatrixAt( i, dummy.matrix );
        }

        cones.instanceMatrix.needsUpdate = true;
    } );
}

function animateGlow() {
    glowPaths.forEach( ( { curve, glows } ) => {
        const count = glows.count;
        const dummy = new THREE.Object3D();
        
        for ( let i = 0; i < count; i++ ) {
            // Increment t
            let t = glows.userData.ts[ i ];
            t += speed;
            if ( t >= 1 ) t--;
            glows.userData.ts[ i ] = t;
            
            // Position at new t
            const pos = curve.getPoint( t );

            dummy.position.copy( pos );
            dummy.updateMatrix();

            glows.setMatrixAt( i, dummy.matrix );
        }

        glows.instanceMatrix.needsUpdate = true;
    } );
}

function animateTape() {
    tapePaths.forEach( ( tape ) => {
        tape.currentSegment += 0.2;
        if ( tape.currentSegment > tape.totalSegments ) {
            tape.currentSegment = 0;
        }
    
        const indices = [];
        const accumulator = Math.floor( tape.currentSegment ); // Accumulated number of segments to add
        for ( let i = 0; i < accumulator; i++ ) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = i * 2 + 2;
            const d = i * 2 + 3;
            indices.push( a, b, d, a, d, c );
        }
    
        tape.geometry.setIndex( indices );
        tape.geometry.computeVertexNormals();
    } );
}

function createTrajectory( path, color = 0x000000 ) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array( path.length * 3 );
  
    for ( let i = 0; i < path.length; i++ ) {
      vertices[ i * 3 + 0 ] = path[ i ].x;
      vertices[ i * 3 + 1 ] = path[ i ].y;
      vertices[ i * 3 + 2 ] = path[ i ].z;
    }
  
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  
    const material = new THREE.LineBasicMaterial( { color } );
    return new THREE.Line( geometry, material );
}

function createCones( curve, color = 0x00000 ) {
    const count = Math.floor( curve.getLength() * 5 );
    const cone = createInstancedCone( count, color );

    const dummy = new THREE.Object3D();
    const ts = [];

    for ( let i = 0; i < count; i++ ) {
        const t = i / count;
        ts.push( t );

        const pos = curve.getPoint( t );
        const dir = curve.getTangent( t ).normalize();

        // Align arrow along direction
        const axis = new THREE.Vector3( 0, 1, 0 ); // default arrow points in +Y
        const quaternion = new THREE.Quaternion().setFromUnitVectors( axis, dir );

        dummy.position.copy( pos );
        dummy.quaternion.copy( quaternion );
        dummy.updateMatrix();
        cone.setMatrixAt( i, dummy.matrix );
    }
    cone.userData.ts = ts;
    cone.instanceMatrix.needsUpdate = true;

    return cone;
}

function createGlowSpheres( curve, color = 0x00000, maxCurveLength = 15 ) {
    // Apply threshold to curve length
    const curveLength = curve.getLength();
    const tMax = Math.min( 1, maxCurveLength / curveLength );

    const count = Math.floor( curveLength * tMax * 20 );
    const glow = createInstancedGlow( count, color );

    const dummy = new THREE.Object3D();
    const ts = [];

    for ( let i = 0; i < count; i++ ) {
        const t = ( i / count ) * tMax;
        ts.push( t );

        const pos = curve.getPoint( t );

        dummy.position.copy( pos );
        dummy.updateMatrix();
        glow.setMatrixAt( i, dummy.matrix );
    }
    glow.userData.ts = ts;
    glow.instanceMatrix.needsUpdate = true;

    return glow;
}

function createInstancedCone( count, color ) {
    // Radius, height, radialSegments, heightSegments
    const geometry = new THREE.ConeGeometry( 0.01, 0.03, 6, 1 );
    const material = new THREE.MeshBasicMaterial( { color } );
    
    return new THREE.InstancedMesh( geometry, material, count );
}

function createInstancedGlow( count, color ) {
    // Radius
    const geometry = new THREE.SphereGeometry( 0.01 );
    const material = new FakeGlowMaterial( { glowColor: color } );

    return new THREE.InstancedMesh( geometry, material, count );
}

function createTape( curve, color, segments = 100 ) {
    const tapeWidth = 0.05;
    const positions = [];

    for ( let i = 0; i <= segments; i++ ) {
        const t = i / segments;
        const pt = curve.getPoint( t );
        const tangent = curve.getTangent( t ).normalize();

        // Define twist angle
        const twistAngle = t * Math.PI * 4; // 2 full twists

        // Define a default normal vector
        let normal = new THREE.Vector3( 0, 1, 0 );
        // Ensure normal is not colinear with tangent
        if ( Math.abs( tangent.dot( normal ) ) > 0.99 ) {
            normal = new THREE.Vector3( 1, 0, 0 );
        }

        // Compute a perpendicular vector to tangent
        const binormal = new THREE.Vector3().crossVectors( tangent, normal ).normalize();
        normal.crossVectors( binormal, tangent ).normalize(); // recompute normal

        // Apply twist: rotate normal around tangent
        const quaternion = new THREE.Quaternion().setFromAxisAngle( tangent, twistAngle );
        normal.applyQuaternion( quaternion );

        // Offset left/right
        const left = pt.clone().addScaledVector( normal, -tapeWidth / 2 );
        const right = pt.clone().addScaledVector( normal, tapeWidth / 2 );

        positions.push( left.x, left.y, left.z );
        positions.push( right.x, right.y, right.z );
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    geometry.setIndex( [] ); // Initially empty

    const material = new THREE.MeshPhongMaterial( {
        color,
        side: THREE.DoubleSide
    } );
    const mesh = new THREE.Mesh( geometry, material );

    return {
        mesh,
        geometry,
        totalSegments: segments,
        currentSegment: 0
    };
}

function getRandomColor() {
    const h = Math.random();                // Any hue
    const s = 0.5 + Math.random() * 0.5;    // Saturation: 50–100%
    const l = 0.1 + Math.random() * 0.2;    // Lightness: 10–30% for darkness

    const color = new THREE.Color();
    color.setHSL( h, s, l );
    return color;
}

function getDarkenColor( color ) {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL( hsl );

    hsl.l -= 0.2;
    hsl.l = Math.max( 0.05, Math.min( 1, hsl.l ) );

    const darker = new THREE.Color();
    darker.setHSL( hsl.h, hsl.s, hsl.l );
    return darker;
}

// function createTape( curve, color ) {
//     const segments = 100;
//     const tapeWidth = 0.05;
//     const geometry = new THREE.BufferGeometry();
//     const positions = [];

//     for ( let i = 0; i <= segments; i++ ) {
//         const t = i / segments;
//         const pt = curve.getPoint( t );
//         const tangent = curve.getTangent( t ).normalize();

//         // Define twist angle — here you can animate or vary it
//         const twistAngle = t * Math.PI * 4; // 2 full twists

//         // Define a default normal vector
//         let normal = new THREE.Vector3( 0, 1, 0 );

//         // Ensure normal is not colinear with tangent
//         if ( Math.abs( tangent.dot( normal ) ) > 0.99 ) {
//             normal = new THREE.Vector3( 1, 0, 0 );
//         }

//         // Compute a perpendicular vector to tangent
//         const binormal = new THREE.Vector3().crossVectors( tangent, normal ).normalize();
//         normal.crossVectors( binormal, tangent ).normalize(); // recompute normal

//         // Apply twist: rotate normal around tangent
//         const quaternion = new THREE.Quaternion().setFromAxisAngle( tangent, twistAngle );
//         normal.applyQuaternion( quaternion );

//         // Offset left/right
//         const left = pt.clone().addScaledVector( normal, -tapeWidth / 2 );
//         const right = pt.clone().addScaledVector( normal, tapeWidth / 2 );

//         positions.push( left.x, left.y, left.z );
//         positions.push( right.x, right.y, right.z );
//     }

//     // Create geometry
//     geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

//     const indices = [];
//     for ( let i = 0; i < segments; i++ ) {
//         const a = i * 2;
//         const b = i * 2 + 1;
//         const c = i * 2 + 2;
//         const d = i * 2 + 3;
//         indices.push( a, b, d, a, d, c );
//     }
//     geometry.setIndex( indices );
//     geometry.computeVertexNormals();

//     const material = new THREE.MeshPhongMaterial( { color, side: THREE.DoubleSide } );
//     return new THREE.Mesh( geometry, material );
// }