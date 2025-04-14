import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/Addons.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import Stats from 'three/examples/jsm/libs/stats.module'

import { initSimulation, updateSimulation } from './src/simulation';
import { GradientSkydome, skydomeAnimate } from './src/gradientSkydome';
import { createUI, preloadFont } from './src/ui';
import { initWebControl, updateWebControlEvent } from './src/webControl';
import { initVrControl, updateVRControlEvent } from './src/vrControl';
import { animatePath } from './src/visualization';

export const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 5000 );
const controller = renderer.xr.getController( 1 ); // First controller
const clock = new THREE.Clock();
const stats = new Stats()

init();

function init() {
    ////
    // Set up camera & renderer
    ////

    camera.position.set( 0, 2, 3 );

    renderer.xr.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio ); // TODO:
    renderer.setSize( window.innerWidth, window.innerHeight );
    setupWebSession(); // Start running animation loop

    ////
    // Set up WebXR
    ////

    document.body.appendChild( renderer.domElement );
    document.body.appendChild( XRButton.createButton( renderer ) );

    ////
    // Set up scene
    ////

    // FPS tracker
    document.body.appendChild( stats.dom )

    // Skydome
    const skydome = new GradientSkydome();
    scene.add( skydome );

    // Controller model
    scene.add( controller );

    // Key light (main source)
    const keyLight = new THREE.DirectionalLight( 0xffffff, 1.2 );
    keyLight.position.set( 5, 10, 5 );
    keyLight.target.position.set( 0, 2, -3 );
    scene.add( keyLight );
    scene.add( keyLight.target );

    // Fill light (soft shadow filler)
    const fillLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
    fillLight.position.set( -5, 5, 2 );
    fillLight.target.position.set( 0, 2, -3 );
    scene.add( fillLight );
    scene.add( fillLight.target );

    // Rim light (from behind to highlight edges)
    const rimLight = new THREE.DirectionalLight( 0xffffff, 0.8 );
    rimLight.position.set( 0, 4, -6 );
    rimLight.target.position.set( 0, 2, -3 );
    scene.add( rimLight );
    scene.add( rimLight.target );

    // Soft ambient light
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
    scene.add( ambientLight );

    initSimulation( scene );
    
    // Add controller model for XR
    const controllerModelFactory = new XRControllerModelFactory();
    const controllerGrip = renderer.xr.getControllerGrip( 1 );
    controllerGrip.add( controllerModelFactory.createControllerModel( controllerGrip ) );
    scene.add( controllerGrip );

    // Load font file
    preloadFont().then( () => {
        ////
        // Set up control panel
        ////

        const ui = createUI();
        ui.position.set( 0, 2, -3 );
        scene.add( ui );

        ////
        // Set up user interaction handlers
        ////

        initWebControl( camera, renderer );
        initVrControl( controller, skydome );
    } );
}

function setupWebSession( session ) {
    renderer.setAnimationLoop( ( timestamp, frame ) => {
        let deltaTime = clock.getDelta();
        deltaTime = Math.min( deltaTime, 0.1 );

        skydomeAnimate();
        updateWebControlEvent( deltaTime, camera );
        updateSimulation( deltaTime );
        animatePath();

        renderer.render( scene, camera );
        stats.update()
    } );
}

// Switch to XR session
renderer.xr.addEventListener('sessionstart', () => {
    console.log( "XR session started." );

    const session = renderer.xr.getSession();
    if ( !session ) {
        console.error( "No active XR session found!" );
        return;
    }

    setupXRSession( session );
} );

function setupXRSession( session ) {
    renderer.setAnimationLoop( ( timestamp, frame ) => {
        let deltaTime = clock.getDelta();
        deltaTime = Math.min( deltaTime, 0.1 );
    
        skydomeAnimate();
        updateVRControlEvent( deltaTime );
        updateSimulation( deltaTime );
        animatePath();

        renderer.render( scene, camera );
    } );
}
