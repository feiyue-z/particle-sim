import * as THREE from 'three';

export default class ballParticle extends THREE.Mesh {
    constructor( position, velocity ) {
        const geometry = new THREE.SphereGeometry( 0.05, 32, 32 );
        const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
        super( geometry, material );

        this.position.copy( position );
        this.velocity = velocity.clone();
        this.velocity.z = -3;
        this.angularVelocity = getRandomAngularVelocity();
        this.orbitCenter = position.clone();
        this.age = 0; // In frame
        this.lifetime = 150; // In frame
        this.path = [];
        this.frustumCulled = false;
        this.userData = {
            type: "particle"
        };
    }
}

function getRandomAngularVelocity( maxSpin = 5 ) {
    // Rotating speed in radian/sec around x, y, z
    return new THREE.Vector3(
        ( Math.random() - 0.5 ) * maxSpin,
        ( Math.random() - 0.5 ) * maxSpin,
        ( Math.random() - 0.5 ) * maxSpin
    );
}
