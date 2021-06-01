'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

import {
  GUI
} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; // OrbitControls가 움직이는 카메라에 관성(inertia)을 줘서 카메라가 부드럽게 움직이게 해줌.
  controls.target.set(0, 0, 0); // 카메라가 바라볼 시점을 원점으로 설정함.
  controls.update(); // 값을 변경하면 항상 업데이트를 해줘야 카메라가 해당 시점을 바라보게 됨.

  // create dat.GUI
  const gui = new GUI();

  // create scene
  const scene = new THREE.Scene();

  // create directional light
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4); // 조명의 위치를 지정함.
    scene.add(light);
  }

  // boxGeometry, 퐁-머티리얼을 생성해서 3개의 큐브 메쉬를 만듦.
  // 참고로 각 큐브에 애니메이션을 넣지 않을거기 때문에 cubes = []; 같은 배열에 넣어서 참조할 필요가 없음.
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  // 조명 챕터에서 사용했던 ColorGUIHelper 헬퍼 클래스를 가져와서 dat.GUI에서 컬러값을 받은 뒤 HexString으로 변환해주는 헬퍼 클래스를 만들어 사용할거임.
  /**
   * 참고로 이 헬퍼 클래스의 간단한 원리를 좀 추론해보자면,
   * 
   * 1. dat.GUI의 각 큐브 메쉬의 속성값을 모아놓은 폴더안에 color picker 입력폼에서 컬러를 입력받으면, 
   * 2. dat.GUI는 입력받은 색상값을 setter로 전달해서 material.color에 할당하게 되고,
   * 3. 그 다음 getter를 호출하여 2번에서 할당받은 material.color의 컬러값으로부터 '#ffffff' 이런 식으로 HexString 형태로 변환해서 dat.GUI에 리턴해주는거지
   * 4. 그러면 dat.GUI는 HexString값을 리턴받아서 현재 변경된 큐브 메쉬의 컬러값을 입력폼에 업데이트 해주는거지.
   * 
   * 정확하지는 않지만 dat.GUI 내부에서 이런 원리로 ColorGUIHelper를 사용할 것 같음... 
   */
  class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }

    get value() {
      return `#${this.object[this.prop].getHexString()}`;
    }

    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({
      color
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;

    // 각 큐브 메쉬의 material.color, cube.scale.x 값을 dat.GUI로 입력받을 수 있는 
    // colorPicker 입력폼과 일반 입력폼을 각 큐브메쉬에 관한 입력폼을 모아두는 폴더에 추가함.
    const folder = gui.addFolder(`Cube${x}`); // 우선 큐브메쉬에 관한 입력폼을 모아둘 폴더를 만들고
    folder.addColor(new ColorGUIHelper(material, 'color'), 'value') // color picker 입력폼 추가
      .name('color') // 입력폼의 label 추가
      .onChange(requestAnimateIfNotRequested); // 이것도 큐브 메쉬의 속성값이 바뀌는거기 때문에 입력값이 변화할 때마다 animate를 호출해서 렌더해줘야 함.
    folder.add(cube.scale, 'x', 0.1, 1.5)
      .name('scale x')
      .onChange(requestAnimateIfNotRequested); // 이것도 큐브 메쉬의 scale값을 바꾸는 거니까 animate를 호출해서 렌더해줘야지
    folder.open(); // 폴더의 기본값은 open해두는 상태로 할 것.

    return cube;
  }

  makeInstance(geometry, 0x44aa88, 0);
  makeInstance(geometry, 0x8844aa, -2);
  makeInstance(geometry, 0xaa8844, 2);

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // OrbitControls.update()가 animate를 요청하면 false, requestAnimationFrame()이 animate를 요청하면 true를 할당받는 변수
  let animateRequested = false;

  // animate
  // OrbitControls가 'change' 이벤트를 받거나, 브라우저가 'resize' 이벤트를 받을 때만 다시 호출하도록 함.
  // 처음 한 번만 렌더링하고, 그 후에 변화가 있을 때만 렌더링하여 불필요한 렌더링을 반복하지 않도록 함.
  // 그걸 위해서 requestAnimationFrame이나 애니메이션 관련 코드를 제거한 상태임.
  function animate() {
    animateRequested = false; // animate 메소드가 호출되면 animateRequested를 false로 초기화하고 시작함.

    // renderer가 resize되면 카메라의 aspect도 바뀌어야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // OrbitControls.update()는 1. camera's transform에 변화가 있거나 2. enableDamping값이 활성화되면
    // 반드시 호출해줘야 함. 2번의 경우 update loop 안에서 호출해줘야 한다고 나와있음.
    controls.update();

    renderer.render(scene, camera);
  }
  animate();

  // animate 함수 내에서 OrbitControls.update()를 계속 호출하면 OrbitControls에 'change'이벤트를 계속 보내는 것과 다름없음.
  // 그럼 결국 이벤트리스너에 걸려서 또 animate 함수를 무한정 호출하겠지
  // 변수 하나를 두고, 그 변수값에 따라 update가 animate를 요청하면 animate를 호출시키기 못하게 하고,
  // requestAnimationFrame이 animate를 요청하면 animate를 호출할 수 있도록 수정해줘야 함. -> 이걸 위해서 만든 함수가 requestAnimateIfNotRequested() 
  // 좀 더 구체적으로 설명을 하자면,
  // requestAnimationFrame(animate)를 호출하면, animateRequested = true로 바꾸는거지. 왜? animate 함수를 요청했으니까.
  // 이 값이 true가 된 상태에서는, controls.update()가 호출되어 이벤트리스너에 의해 requestAnimateIfNotRequested를 호출한다고 하더라도,
  // 현재 animateRequested가 true인 상황이기 때문에(즉, 이미 먼저 animate 함수를 요청했다는 거지) if block을 통과하지 못하게 만드는 원리임.
  // 그렇게 하면 결과적으로 animate 함수 내부에서 update()가 호출된다고 해도 그것이 animate를 반복호출하지 못하게 만드는 셈이 되는 것. 
  // 그냥 이 정도로만 이해하고 있자.. 너무 깊게 생각하면 복잡한 거 같음ㅠ
  function requestAnimateIfNotRequested() {
    if (!animateRequested) {
      animateRequested = true;
      requestAnimationFrame(animate);
    }
  }

  // OrbitControls가 canvas에서 이벤트를 받아 카메라 설정을 바꿀 때마다 animate 함수를 호출함. 
  // 이걸 하려면 OrbitControls에 있는 'change'이벤트를 이용하면 됨.
  // requestAnimateIfNotRequested는 animate가 update에 의해 호출되었는지, requestAnimationFrame에 의해 호출되었는지 확인하고 나서 animate를 호출할지 말지를 결정하는 함수.
  controls.addEventListener('change', requestAnimateIfNotRequested);

  // 또 창 크기가 바뀌면 카메라의 비율값도 다시 계산해줘야 하는데, 그 코드가 animate 함수 내부에 있으므로,
  // 브라우저에 resize 이벤트가 발생해도 animate를 호출하도록 함.
  window.addEventListener('resize', animate);
}

main();