import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { EmitterSettings, ParticleParams, ParticleType, VisualizationSettings, VisualizationMode, clickables } from './global';
import { addObjectsToScene } from './visualization';

export let loadedFont = null;

const INACTIVE_BUTTON_COLOR = 0x96b6ff;
const ACTIVE_BUTTON_COLOR = 0x56f580;
const ui = new THREE.Group();

export function preloadFont() {
    return new Promise( (resolve, reject ) => {
        const loader = new FontLoader();
        loader.load(
            'fonts/helvetiker_regular.typeface.json',
            ( font ) => {
                loadedFont = font;
                resolve( font );
            },
            undefined,
            ( error ) => reject( error )
        );
    } );
}

class RoundedRectangle extends THREE.Mesh {
    constructor( width, height, radius, options = {} ) {
        const {
            depth = 0.05,
            color = 0xffffff
        } = options;

        const shape = new THREE.Shape();
        shape.moveTo( -width / 2 + radius, -height / 2 );
        shape.lineTo( width / 2 - radius, -height / 2 );
        shape.quadraticCurveTo( width / 2, -height / 2, width / 2, -height / 2 + radius );
        shape.lineTo( width / 2, height / 2 - radius );
        shape.quadraticCurveTo( width / 2, height / 2, width / 2 - radius, height / 2 );
        shape.lineTo( -width / 2 + radius, height / 2 );
        shape.quadraticCurveTo( -width / 2, height / 2, -width / 2, height / 2 - radius );
        shape.lineTo( -width / 2, -height / 2 + radius );
        shape.quadraticCurveTo( -width / 2, -height / 2, -width / 2 + radius, -height / 2 );
    
        const geometry = new THREE.ExtrudeGeometry( shape, { depth, bevelEnabled: false } );
        const material = new THREE.MeshPhongMaterial( {
            color,
            transparent: true,
            opacity: 0.75
        } );
        
        super( geometry, material );
        this.color = color;
        this.frustumCulled = false;
        this.userData = {
            type: "ui"
        };
    }

    setColor( color ) {
        this.material.color.set( color );     
    }

    resetColor() {
        this.material.color.set( this.color );
    }
}

class TextMesh extends THREE.Object3D {
    constructor( text, options = {} ) {
        const {
            color = 0x000000,
            size = 0.2,
            depth = 0.01
        } = options;

        if ( !loadedFont )  {
            console.error( "Font not loaded!" );
            return;
        }

        super();
        this.text = String( text );
        this.color = color;
        this.size = size;
        this.depth = depth;
        
        this.createTextMesh();
    }

    createTextMesh() {
        const textGeometry = new TextGeometry( this.text, {
            font: loadedFont,
            size: this.size,
            depth: this.depth
        } );
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial( { color: this.color } );
        this.mesh = new THREE.Mesh( textGeometry, textMaterial );

        this.add( this.mesh );
    }

    setText( text ) {
        this.text = String( text );

        if ( this.mesh ) {
            this.remove( this.mesh ); // Remove old mesh from the scene
            this.mesh.geometry.dispose(); // Free up memory
            this.mesh.material.dispose(); // Free up memory
        }

        this.createTextMesh();
    }
}

class Board extends RoundedRectangle {
    constructor( width, height, text, options = {} ) {
        const {
            size = 0.2
        } = options;

        super( width, height, 0.12 );

        this.textMesh = new TextMesh( text, { size } );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.add( this.textMesh );
    }

    setText( text ) {
        this.textMesh.setText( text );
    }
}

class CallbackButton extends RoundedRectangle {
    constructor( width, height, text, callback ) {
        super( width, height, 0.12, { color: INACTIVE_BUTTON_COLOR } );

        this.callback = callback;

        this.textMesh = new TextMesh( text );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.textMesh.traverse( obj => obj.layers.set( 1 ) );
        this.add( this.textMesh );

        this.userData = {
            type: "button"
        };
    }

    onClick() {
        this.callback();
    }
}

class ValueAdjustButton extends RoundedRectangle {
    constructor( width, height, text, getValue, setValue, delta, options ) {
        const {
            min = -Infinity,
            max = Infinity,
            displayer = null
        } = options;

        super( width, height, 0.12, { color: INACTIVE_BUTTON_COLOR } );

        this.getValue = getValue;
        this.setValue = setValue;
        this.delta = delta;
        this.min = min;
        this.max = max;
        this.displayer = displayer;
        
        this.textMesh = new TextMesh( text );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.textMesh.traverse( obj => obj.layers.set( 1 ) );
        this.add( this.textMesh );

        this.userData = {
            type: "button"
        };
    }

    onClick() {
        const val = this.getValue() + this.delta;
        
        if ( val >= this.min && val <= this.max ) {
            this.setValue( val );

            if ( this.displayer ) {
                this.displayer.setValueText( this.getValue().toFixed( 2 ) ); // 2 digit after decimal point
            }
        }
    }
}

class ValueDisplayer extends RoundedRectangle {
    constructor( width, height, valueTag, options = {} ) {
        const {
            textSize = 0.2,
            getValue = null
        } = options;

        super( width, height, 0.2 );

        this.tagMesh = new TextMesh(
            valueTag,
            { size: textSize }
        );
        this.tagMesh.position.set( 0, 0.15, 0.1 );
        this.tagMesh.raycast = () => {};

        this.valueMesh = new TextMesh(
            getValue ? getValue().toFixed( 2 ) : "--",
            { size: textSize }
        );
        this.valueMesh.position.set( 0, -0.15, 0.1 );
        this.valueMesh.raycast = () => {};

        this.add( this.tagMesh );
        this.add( this.valueMesh );
    }

    setValueText( text ) {
        this.valueMesh.setText( text );
    }
}

function createValueContoller( valueTag, getValue, setValue, delta, options = {} ) {
    const {
        min = -Infinity,
        max = Infinity
    } = options;
    
    const displayer = new ValueDisplayer( 2, 0.8, valueTag, { getValue } );

    const minusButton = new ValueAdjustButton(
        0.5, 0.5, "-",
        getValue, setValue,
        -delta,
        { min, max, displayer }
    );

    const addButton = new ValueAdjustButton(
        0.5, 0.5, "+",
        getValue, setValue,
        delta,
        { min, max, displayer }
    );

    const elements = [ minusButton, displayer, addButton ];
    arrangeHorizontally( elements, 1.4 );

    const controller = new THREE.Group();
    elements.forEach( el => controller.add( el ) );

    return controller;
}

function createEmitterControlPanel() {
    // UI components
    const title = new Board( 3, 0.6, "Emitter Control" );

    const rateController = createValueContoller(
        "Rate",
        () => EmitterSettings.rate,
        v => EmitterSettings.rate = v,
        1,
        { min: 0, max: 15 }
    );

    const spreadController = createValueContoller(
        "Spread",
        () => EmitterSettings.spread,
        v => EmitterSettings.spread = v,
        0.5,
        { min: 0, max: 3 }
    );

    // Layout
    const components = [ title, rateController, spreadController ];
    arrangeVertically( components, 1 );

    // Assemble panel
    const panel = new THREE.Group();
    components.forEach( c => panel.add( c ) );

    return panel;
}

function createVisualizationControlPanel() {
    // UI components
    const title = new Board( 3, 0.6, "Visualization Control" );
    title.position.set( 0, 2, 0 );

    // Animation button
    const animationButton = new CallbackButton(
        2.4, 0.6,
        "Start animation",
        function () {
            VisualizationSettings.animation = !VisualizationSettings.animation;

            if ( VisualizationSettings.animation ) {
                this.setColor( ACTIVE_BUTTON_COLOR );
            } else {
                this.resetColor();
            }
        }
    );
    animationButton.position.set( 0, 1, 0 );
    
    // Buttons for switching panels
    const classicButton = new CallbackButton(
        1.5, 0.6,
        "Classic",
        () => switchButton( 0 )
    );
    const tapeButton = new CallbackButton(
        1.5, 0.6,
        "Tape",
        () => switchButton( 1 )
    );
    const neonButton = new CallbackButton(
        1.5, 0.6,
        "Neon",
        () => switchButton( 2 )
    );
    const buttons = [ classicButton, tapeButton, neonButton ];
    let activeButtonIndex = -1;

    // Button bar container
    const buttonBar = new THREE.Group();
    buttons.forEach( button => buttonBar.add( button ) );
    arrangeHorizontally( buttons, 2 );
    
    function switchButton( buttonIndex ) {
        if ( buttonIndex === activeButtonIndex ) return;

        if ( activeButtonIndex !== -1 ) {
            buttons[ activeButtonIndex ].resetColor();
        }

        activeButtonIndex = buttonIndex;
        buttons[ activeButtonIndex ].setColor( ACTIVE_BUTTON_COLOR );
        VisualizationSettings.mode = Object.values( VisualizationMode )[ activeButtonIndex ];
        addObjectsToScene();
    }

    //
    const panel = new THREE.Group();
    panel.add( title );
    panel.add( animationButton )
    panel.add( buttonBar );
    
    // arrangeVertically();

    // Set initial active button
    switchButton( 0 );

    return panel;
}

function createParticleControlPanel( type ) {
    // const massController = createValueContoller(
    //     "Mass",
    //     () => particleParams[ type ].mass,
    //     v => particleParams[ type ].mass = v,
    //     0.01,
    //     { min: 0.01, max: 50 }
    // );
    const gravityController = createValueContoller(
        "Gravity",
        () => ParticleParams[ type ].gravity,
        v => ParticleParams[ type ].gravity = v,
        1,
        { min: -100, max: 100 }
    );
    const jitterController = createValueContoller(
        "Jitter",
        () => ParticleParams[ type ].jitterFactor,
        v => ParticleParams[ type ].jitterFactor = v,
        0.1,
        { min: 0, max: 1 }
    );
    const dragController = createValueContoller(
        "Drag",
        () => ParticleParams[ type ].drag,
        v => ParticleParams[ type ].drag = v,
        0.1,
        { min: 0, max: 1 }
    );

    const controls = [ gravityController, jitterController, dragController ];
    arrangeVertically( controls );

    const panel = new THREE.Group();
    controls.forEach( c => panel.add( c ) );

    return panel;
}

function createParticleControlConsole() {
    // Panels for each particle type
    const bubblePanel = createParticleControlPanel( ParticleType.BUBBLE );
    const confettiPanel = createParticleControlPanel( ParticleType.CONFETTI );
    const ballPanel = createParticleControlPanel( ParticleType.BALL );
    const panels = [ bubblePanel, confettiPanel, ballPanel ];

    // Active panel pointer
    let activePanel = null;

    // Root container
    const controlConsole = new THREE.Group();;

    // Tabs for switching panels
    const bubbleTab = new CallbackButton(
        1.5, 0.6,
        "Bubble",
        () => switchTab( 0 )
    );
    const confettiTab = new CallbackButton(
        1.5, 0.6,
        "Confetti",
        () => switchTab( 1 )
    );
    const ballTab = new CallbackButton(
        1.5, 0.6,
        "Ball",
        () => switchTab( 2 )
    );
    const tabs = [ bubbleTab, confettiTab, ballTab ];
    let activeTabIndex = -1;

    // Tab bar container
    const tabBar = new THREE.Group();
    tabs.forEach( tab => tabBar.add( tab ) );
    arrangeHorizontally( tabs );

    function switchTab( tabIndex ) {
        if ( tabIndex === activeTabIndex ) return;

        if ( activeTabIndex !== -1 ) {
            controlConsole.remove( activePanel );

            tabs[ activeTabIndex ].resetColor();
        }

        activeTabIndex = tabIndex;
        activePanel = panels[ activeTabIndex ];
        controlConsole.add( activePanel );

        tabs[ activeTabIndex ].setColor( ACTIVE_BUTTON_COLOR );
        EmitterSettings.type = Object.values( ParticleType )[ activeTabIndex ];

        updateClickables();
    }

    // Assemble console UI
    // and set initial active tab
    controlConsole.add( tabBar );
    switchTab( 0 );

    return controlConsole;
}

function arrangeHorizontally( objects, spacing = 2 ) {
    const offset = -( ( objects.length - 1 ) * spacing ) / 2;
    objects.forEach( ( obj, index ) => {
        obj.position.x = index * spacing + offset;
    } );
}

function arrangeVertically( objects, spacing = 1 ) {
    const offset = -( ( objects.length - 1 ) * spacing ) / 2;
    objects.forEach( ( obj, index ) => {
        obj.position.y = -index * spacing + offset;
    } );
}

function updateClickables() {
    // Clear previous data
    clickables.length = 0;

    ui.traverse( obj => {
        if ( obj.userData?.type === "button" ) {
            clickables.push( obj );
        }
    } );
}

export function createUI() {
    // Create left panels
    const emitterControlPanel = createEmitterControlPanel();
    const visualizationControlPanel = createVisualizationControlPanel();

    const leftPanels = new THREE.Group();
    leftPanels.add( emitterControlPanel );
    leftPanels.add( visualizationControlPanel );
    leftPanels.rotateY( Math.PI / 3 );
    
    // Create right panel
    const particleControlConsole = createParticleControlConsole();
    particleControlConsole.rotateY( -Math.PI / 3 );
    
    // Assemble UI
    const panels = [ leftPanels, particleControlConsole ];
    arrangeHorizontally( panels, 8 );

    panels.forEach( p => ui.add( p ) );
    updateClickables();

    return ui;
}