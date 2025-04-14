import * as THREE from 'three';
import { gsap } from "gsap";

import { spawnParticles } from './simulation';
import { clickables } from './global';

const keyMap = new Map();
let targetRotationX = 0.0, targetRotationY = 0.0;

const prevMouse = new THREE.Vector2();
const mouseNDC = new THREE.Vector2();
const mouseWorldPos = new THREE.Vector3();
let mouseDown = false;

const mouseRaycaster = new THREE.Raycaster();
mouseRaycaster.layers.set( 0 );

let mouseSelectedObject = null;
let mouseObjectOffset = new THREE.Vector3();
let mouseObjectDepth = 0.0; // Depth from camera to intersected object

const NAVIGATE_STEP = 0.02;
const ROTATION_SENSITIVITY = 0.001;

export function initWebControl( camera, renderer ) {
    // Listen to window resize event
    window.addEventListener( 'resize', () => {
        renderer.setSize( window.innerWidth, window.innerHeight );
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    } );

    window.addEventListener( 'mousedown', ( event ) => {
        mouseDown = true;

        updateMouseNDC( event );
        updateMouseWorldPos( camera );
        updateRaycaster( camera );
        updateIntersection( camera );
        handleButtonClick();
    } );

    window.addEventListener( 'mousemove', ( event ) => {
        updateMouseNDC( event );
        updateTargetRotation( event );
        updateMouseWorldPos( camera );
    } );
    
    window.addEventListener( 'mouseup', () => {
        mouseDown = false;
        mouseSelectedObject = null;
    } );

    document.addEventListener( 'keydown', ( event ) => {
        keyMap.set( event.code, true );
    } );

    document.addEventListener( 'keyup', ( event ) => {
        keyMap.set( event.code, false );
    } );
}

export function updateWebControlEvent( deltaTime, camera ) {
    if ( mouseDown && !mouseSelectedObject ) spawnParticles( deltaTime, mouseWorldPos );

    if ( keyMap.get( 'KeyW' ) ) camera.translateZ( -NAVIGATE_STEP );
    if ( keyMap.get( 'KeyS' ) ) camera.translateZ(  NAVIGATE_STEP );
    if ( keyMap.get( 'KeyA' ) ) camera.translateX( -NAVIGATE_STEP );
    if ( keyMap.get( 'KeyD' ) ) camera.translateX(  NAVIGATE_STEP );
    if ( keyMap.get( 'ShiftLeft' ) ) {
        camera.rotation.x = targetRotationX * ROTATION_SENSITIVITY;
        camera.rotation.y = targetRotationY * ROTATION_SENSITIVITY;
    }
}

function updateMouseNDC( event ) {
    // Project 2D mouse position to 3D space
    mouseNDC.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseNDC.y = -( event.clientY / window.innerHeight ) * 2 + 1;
}

function updateMouseWorldPos( camera ) {
    if ( !mouseDown ) return;

    const ndc = new THREE.Vector3( mouseNDC.x, mouseNDC.y, 0.5 );
    ndc.unproject( camera );

    const dir = ndc.clone().sub( camera.position ).normalize();
    mouseWorldPos.copy( camera.position.clone().add( dir.multiplyScalar( 3 ) ) ); // Z distance = 3
}

function updateTargetRotation( event ) {
    const dx = event.clientX - prevMouse.x;
    const dy = event.clientY - prevMouse.y;
    prevMouse.x = event.clientX;
    prevMouse.y = event.clientY;

    if ( keyMap.get( 'ShiftLeft' ) ) {
        targetRotationX += dy;
        targetRotationY += dx;
    }
}

function updateRaycaster( camera ) {
    mouseRaycaster.setFromCamera( mouseNDC, camera );
}

function updateIntersection( camera ) {
    const intersects = mouseRaycaster.intersectObjects( clickables, true );
    if ( intersects.length === 0 ) return;

    mouseSelectedObject = intersects[ 0 ].object;

    // NOTE:
    // - intersects[ 0 ].point:
    // the exact 3D world coordinates where the ray hits the object
    // - intersects[ 0 ].object.position:
    // the position of the object’s origin

    mouseObjectOffset.copy( intersects[ 0 ].point ).sub( mouseSelectedObject.position );
    mouseObjectDepth = camera.position.distanceTo( mouseSelectedObject.position );

    // console.log( 'Mouse clicked on:', intersects[ 0 ].object );
}

function handleButtonClick() {
    if ( !mouseSelectedObject ) return;

    if ( mouseSelectedObject.userData.type == "button" ) {
        mouseSelectedObject.onClick();
    }
}