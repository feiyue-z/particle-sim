import * as THREE from 'three';

const texturePaths = [
    'textures/bubble/bubble_1.png',
    'textures/bubble/bubble_2.png',
    'textures/bubble/bubble_3.png',
    'textures/bubble/bubble_4.png',
    'textures/bubble/bubble_5.png',
    'textures/bubble/bubble_6.png',
    'textures/bubble/bubble_7.png',
];

export default class BubbleParticle extends THREE.Sprite {
    constructor( position, velocity ) {
        const texturePath = texturePaths[ Math.floor( Math.random() * texturePaths.length ) ];
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load( texturePath );

        const material = new THREE.SpriteMaterial( {
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        } );
        super( material );

        this.scale.set( 0.2, 0.2, 1 );
        this.position.copy( position );
        this.velocity = velocity.clone();
        this.lifetime = 150; // In frame
        this.age = 0; // In frame
        this.path = [];
        this.frustumCulled = false;
        this.userData = {
            type: "particle"
        };
    }
}