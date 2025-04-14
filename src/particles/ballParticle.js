import * as THREE from 'three';

export default class ballParticle extends THREE.Mesh {
    constructor( position, velocity ) {
        const geometry = new THREE.SphereGeometry( 0.05, 32, 32 );
        const material = new THREE.MeshStandardMaterial( {
            color: 0xffffff,
            roughness: 0.5,
            metalness: 0,
        } );
        
        super( geometry, material );

        this.position.copy( position );
        this.velocity = velocity.clone();
        this.velocity.z = -3;
        this.angularVelocity = getRandomAngularVelocity();
        // this.angularVelocity = new THREE.Vector3(0);
        // this.orbitCenter = position.clone();
        this.orbitCenter = new THREE.Vector3( 0, 1, -1 );
        // this.color = color;
        this.age = 0; // In frame
        this.lifetime = 150; // In frame
        this.path = [];
        this.frustumCulled = false;
        this.userData = {
            type: "particle"
        };
    }
}

function getRandomAngularVelocity( maxSpin = 10 ) {
    // Rotating speed in radian/sec around x, y, z
    return new THREE.Vector3(
        ( Math.random() - 0.5 ) * 2 * maxSpin,
        ( Math.random() - 0.5 ) * 2 * maxSpin,
        ( Math.random() - 0.5 ) * 2 * maxSpin
    );
}
