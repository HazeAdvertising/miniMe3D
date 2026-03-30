import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const clock = new THREE.Clock();

let mixer, model1;
let idleAkcija, trenutnaAkcija;

const animacije = {};
const sounds = {};
let idleSound;
let listener;

// SCENA
const scene = new THREE.Scene();
const container = document.getElementById('three-container');
const camera = new THREE.PerspectiveCamera(45, container.innerWidth / container.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);
camera.aspect = container.clientWidth / container.clientHeight;
camera.updateProjectionMatrix();


const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// AUDIO
listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();

function loadSound(name, file) {
    const sound = new THREE.Audio(listener);
    audioLoader.load(file, (buffer) => {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
    });
    sounds[name] = sound;
}

// 🔊 IDLE SOUND
idleSound = new THREE.Audio(listener);
audioLoader.load('beat.mp3', (buffer) => {
    idleSound.setBuffer(buffer);
    idleSound.setLoop(true);
    idleSound.setVolume(0.4);
});

// HDR
new RGBELoader().load('cc.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// SVETLO
scene.add(new THREE.AmbientLight(0xffffff, 1));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 0, 3);
scene.add(light);

// LOADER
const loader = new GLTFLoader();

// GLAVNI MODEL
loader.load('JaSam.glb', (gltf) => {
    model1 = gltf.scene;
    model1.scale.set(5, 5, 5);
    model1.position.set(0, -7, 3);
    scene.add(model1);

    mixer = new THREE.AnimationMixer(model1);

    if (gltf.animations.length > 0) {
        idleAkcija = mixer.clipAction(gltf.animations[0]);
        idleAkcija.play();
        trenutnaAkcija = idleAkcija;

        // 🔊 start idle zvuka
        if (idleSound.buffer) idleSound.play();
    }

    mixer.addEventListener('finished', () => {
        if (trenutnaAkcija !== idleAkcija) {

            idleAkcija.reset();
            idleAkcija.fadeIn(0.5).play();
            trenutnaAkcija = idleAkcija;

            disableButtons(false);

            // 🔊 vrati idle zvuk
            if (idleSound.buffer && !idleSound.isPlaying) {
                idleSound.play();
            }
        }
    });

}, undefined, console.error);

// ANIMACIJE + ZVUKOVI
const setup = [
    { name: "anim1", file: "kovan.glb", sound: "cigar.mp3" },
    { name: "anim2", file: "call.glb", sound: "bb.mp3" },
    { name: "anim3", file: "anim3.glb", sound: "sound3.mp3" },
    { name: "anim4", file: "anim4.glb", sound: "sound4.mp3" },
    { name: "anim5", file: "anim5.glb", sound: "sound5.mp3" }
];

setup.forEach(({ name, file, sound }) => {

    loader.load(file, (gltf) => {
        if (gltf.animations.length > 0) {
            animacije[name] = gltf.animations[0];
        }
    });

    loadSound(name, sound);
});

// BUTTON CONTROL
function disableButtons(state) {
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById('btn' + i);
        if (btn) btn.disabled = state;
    }
}

// PUSTI ANIMACIJU
function pustiAnimaciju(name) {

    if (trenutnaAkcija && trenutnaAkcija !== idleAkcija) return;

    if (!mixer || !animacije[name]) return;

    const akcija = mixer.clipAction(animacije[name]);

    akcija.reset();
    akcija.setLoop(THREE.LoopOnce);
    akcija.clampWhenFinished = true;

    akcija.fadeIn(0.5).play();

    if (trenutnaAkcija) {
        trenutnaAkcija.fadeOut(0.5);
    }

    trenutnaAkcija = akcija;

    disableButtons(true);

    // 🔴 STOP idle zvuk
    if (idleSound.isPlaying) idleSound.stop();

    // 🔊 play anim sound
    const sound = sounds[name];
    if (sound && sound.buffer) {
        if (sound.isPlaying) sound.stop();
        sound.play();
    }
}

// BUTTONI
document.getElementById('btn1').onclick = () => pustiAnimaciju("anim1");
document.getElementById('btn2').onclick = () => pustiAnimaciju("anim2");
document.getElementById('btn3').onclick = () => pustiAnimaciju("anim3");
document.getElementById('btn4').onclick = () => pustiAnimaciju("anim4");
document.getElementById('btn5').onclick = () => pustiAnimaciju("anim5");

// LOOP
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    controls.update();
    renderer.render(scene, camera);
}
animate();

// RESIZE
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});