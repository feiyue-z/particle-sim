import * as THREE from 'three';

import { spawnParticles } from './simulation';
import { clickables } from './global';

const controllerRaycaster = new THREE.Raycaster();
controllerRaycaster.layers.set( 0 );
controllerRaycaster.far = 10;

let controllerSelecting = false;
let controllerSelectedObject = null;
let controllerObjectOffset = new THREE.Vector3();
let controllerObjectDepth = 0;

let controllerPos = new THREE.Vector3();
let laser = null;

export function initVrControl( controller, skydome ) {
    // VR controller's equivalent of "mouse down"
    controller.addEventListener( 'selectstart', ( event ) => {
        controllerSelecting = true;

        updateIntersection( controller );
        updateControllerPos( controller );
        handleButtonClick();
    } );

    // VR controller's equivalent of "mouse up"
    controller.addEventListener( 'selectend', () => {
        controllerSelecting = false;
        controllerSelectedObject = null;
    } );

    // Triggered when the inner button is pressed
    controller.addEventListener( 'squeeze', () => {
        skydome.visible = !skydome.visible;
    } );

    // Trigerred when a controller is conncected
    controller.addEventListener( 'connected', ( event ) => {
        console.log( "Controller connected:", event.data.handedness );
        createLaserBeam( controller );
    });
}

// VR controller's equivalent of "mouse move"
export function handleControllerSelectMove( controller ) {}

function createLaserBeam( controller ) {
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); // Red beam
    const points = [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -1 ) ]; // Start & end
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    laser = new THREE.Line( geometry, material );
    laser.scale.z = 3; // Length of the beam

    controller.add( laser );
}

export function updateVRControlEvent( deltaTime ) {
    if ( controllerSelecting && !controllerSelectedObject ) {
        // NOTE:
        // `laser.scale.z = 3` does not change the **position property** of the object,
        // as `scale` is a standalone propety
        // So laser's end in its local space is still `1`,
        // `-0.3` here would be then scaled by `scale` property

        const tip = laser.localToWorld( new THREE.Vector3( 0, 0, -0.3 ) );
        spawnParticles( deltaTime, tip );
    }
}

function updateControllerPos( controller ) {
    controller.matrixWorld.decompose( controllerPos, new THREE.Quaternion(), new THREE.Vector3() );
}

function updateIntersection( controller ) {
    // Use controller position and direction to cast a ray
    // matrixWorld encodes a 4x4 transformation matrix that includes translation, rotation, and scale
    controllerRaycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    controllerRaycaster.ray.direction.set( 0, 0, -1 ).applyQuaternion( controller.quaternion );

    // Check for intersections with objects
    const intersects = controllerRaycaster.intersectObjects( clickables, true );

    if ( intersects.length === 0 ) return;
    
    controllerSelectedObject = intersects[ 0 ].object;

    // Compute object offset and depth
    controllerObjectOffset.copy( intersects[ 0 ].point ).sub( controllerSelectedObject.position );
    controllerObjectDepth = controller.position.distanceTo( controllerSelectedObject.position );
}

function handleButtonClick() {
    if ( !controllerSelectedObject ) return;

    if ( controllerSelectedObject.userData.type == "button" ) {
        controllerSelectedObject.onClick();
    }
}