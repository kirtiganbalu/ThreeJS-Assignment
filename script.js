const CLIENT_ID = '1054136154776-cc050a50mfmn881rk9cg73cpqvvmg5u6.apps.googleusercontent.com';
const SPREADSHEET_ID = '1Qae82vzscH0dGInOQW6OVXCIuS5AJLw5FHbXVP9JkIs';

var scene, camera, renderer;
var objects = [];
var targets = { table: [], sphere: [], helix: [], grid: [] };

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Google Sign-In Setup
    window.onload = () => {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => fetchSheetData()
        });
        google.accounts.id.renderButton(document.getElementById("buttonDiv"), { theme: "outline", size: "large" });
    };

    // Button Listeners
    document.getElementById('table').onclick = () => transform(targets.table, 2000);
    document.getElementById('sphere').onclick = () => transform(targets.sphere, 2000);
    document.getElementById('helix').onclick = () => transform(targets.helix, 2000);
    document.getElementById('grid').onclick = () => transform(targets.grid, 2000);

    animate();
}

async function fetchSheetData() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const json = JSON.parse(text.substring(47, text.length - 2));
        
        const sheetData = json.table.rows.map(row => ({
            name: row.c[0]?.v || "",
            photo: row.c[1]?.v || "",
            age: row.c[2]?.v || "",
            country: row.c[3]?.v || "",
            interest: row.c[4]?.v || "",
            netWorth: row.c[5]?.f || row.c[5]?.v || "$0"
        }));

        createTiles(sheetData);
    } catch (e) { console.error("Sheet Fetch Error:", e); }
}

function getBackgroundColor(worth) {
    const val = parseFloat(worth.replace(/[$,]/g, ''));
    if (val < 100000) return "rgba(239, 48, 34, 0.8)"; // Red
    if (val > 200000) return "rgba(0, 255, 0, 0.8)";   // Green
    return "rgba(255, 165, 0, 0.8)";                   // Orange
}

function createTiles(data) {
    // Clear scene
    objects.forEach(obj => scene.remove(obj));
    objects = [];
    targets = { table: [], sphere: [], helix: [], grid: [] };

    data.forEach((item, i) => {
        const element = document.createElement('div');
        element.className = 'element';
        element.style.backgroundColor = getBackgroundColor(item.netWorth);
        element.innerHTML = `
            <img src="${item.photo}" onerror="this.src='https://via.placeholder.com/60'">
            <div class="name">${item.name}</div>
            <div class="details">${item.age} | ${item.country}</div>
            <div class="details">${item.interest}</div>
            <div class="networth">${item.netWorth}</div>
        `;

        const object = new THREE.CSS3DObject(element);
        object.position.set(Math.random()*4000-2000, Math.random()*4000-2000, Math.random()*4000-2000);
        scene.add(object);
        objects.push(object);

        // 1. TABLE Layout (20x10)
        const tObj = new THREE.Object3D();
        tObj.position.x = ((i % 20) * 170) - 1600;
        tObj.position.y = -(Math.floor(i / 20) * 210) + 900;
        targets.table.push(tObj);

        // 2. SPHERE Layout
        const sObj = new THREE.Object3D();
        const phi = Math.acos(-1 + (2 * i) / data.length);
        const theta = Math.sqrt(data.length * Math.PI) * phi;
        sObj.position.setFromSphericalCoords(850, phi, theta);
        sObj.lookAt(new THREE.Vector3().copy(sObj.position).multiplyScalar(2));
        targets.sphere.push(sObj);

        // 3. DOUBLE HELIX Layout
        const hObj = new THREE.Object3D();
        const hPhi = i * 0.175 + (i % 2 === 0 ? 0 : Math.PI); // Creates 2 strands
        hObj.position.setFromCylindricalCoords(900, hPhi, (i * 8) - 450);
        hObj.lookAt(new THREE.Vector3(hObj.position.x * 2, hObj.position.y, hObj.position.z * 2));
        targets.helix.push(hObj);

        // 4. GRID Layout (5 x 4 x 10)
        const gObj = new THREE.Object3D();
        gObj.position.x = ((i % 5) * 400) - 800;
        gObj.position.y = (-(Math.floor(i / 5) % 4) * 400) + 600;
        gObj.position.z = (Math.floor(i / 20)) * -1000;
        targets.grid.push(gObj);
    });

    transform(targets.table, 2000);
}

function transform(targetArray, duration) {
    TWEEN.removeAll();
    objects.forEach((obj, i) => {
        const target = targetArray[i];
        if (target) {
            new TWEEN.Tween(obj.position)
                .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();

            new TWEEN.Tween(obj.rotation)
                .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    scene.rotation.y += 0.001; 
    renderer.render(scene, camera);
}
