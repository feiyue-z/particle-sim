import * as THREE from 'three';

export default class ConfettiParticle extends THREE.Mesh {
    constructor( position, velocity ) {
        const color = getRandomLightColor();
        const geometry = new THREE.PlaneGeometry( 0.1, 0.05 );
        const material = new THREE.MeshBasicMaterial( { color } );
        super( geometry, material );

        this.position.copy( position );
        this.velocity = velocity.clone();
        this.angularVelocity = getRandomAngularVelocity();
        this.orbitCenter = position.clone();
        this.color = color;
        this.age = 0; // In frame
        this.lifetime = 150; // In frame
        this.path = [];
        this.frustumCulled = false;
        this.userData = {
            type: "particle"
        };
    }
}

function getRandomLightColor() {
    const h = Math.random();                 // Any hue
    const s = 0.5 + Math.random() * 0.5;     // Saturation: 50-100%
    const l = 0.7 + Math.random() * 0.2;     // Lightness: 70–90%

    const color = new THREE.Color();
    color.setHSL(h, s, l);
    return `#${ color.getHexString() }`;
}

function getRandomAngularVelocity( maxSpin = 10 ) {
    // Rotating speed in radian/sec around x, y, z
    return new THREE.Vector3(
        ( Math.random() - 0.5 ) * 2 * maxSpin,
        ( Math.random() - 0.5 ) * 2 * maxSpin,
        ( Math.random() - 0.5 ) * 2 * maxSpin
    );
}