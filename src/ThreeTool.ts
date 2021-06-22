/*
 * code by flyteng1874
 * https://juejin.cn/user/1873223545795005
 */

import * as THREE from "three";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

export default class ThreeTool {
  // 必须参数
  // 相机
  public camera: PerspectiveCamera;
  // 方向光
  public directionalLight: DirectionalLight;
  // 环境光
  public ambientLight: AmbientLight;
  // 场景
  public scene: Scene;
  // 光栅化
  public renderer: WebGLRenderer;
  // 光线追踪类
  public raycaster = new THREE.Raycaster();
  // 画布
  public canvas: HTMLCanvasElement;
  // 画布容器
  public container: HTMLElement;
  // 相机轨道控制
  public controls: OrbitControls;
  // 可将dom转化为object3d对象
  public css2drenderer: CSS2DRenderer;

  // 可选参数
  // 性能监控
  public stats?: Stats;

  private mode: "dev" | "pro" = "dev";

  constructor(threeToolParams: {
    canvas: HTMLCanvasElement;
    container: HTMLElement;
    mode: "dev" | "pro";
    clearColor?: Color;
  }) {
    const { canvas, mode, container, clearColor } = threeToolParams;
    this.mode = mode;
    this.canvas = canvas;
    this.container = container;
    this.camera = this.initCamera();
    this.scene = this.initScene();
    this.directionalLight = this.initDirectionalLight();
    this.ambientLight = this.initAmbientLight();
    this.renderer = this.initRenderer({
      canvas,
      clearColor,
    });
    this.css2drenderer = this.initCSS2DRenderer(this.container);
    this.controls = this.initOrbitControls();

    this.scene.add(this.directionalLight);
    this.scene.add(this.ambientLight);

    this.renderer.render(this.scene, this.camera);
    if (mode === "dev") {
      window.THREE = THREE;
      this.stats = this.initStats(container);
    }
  }

  public initCamera(
    cameraParams = { fov: 75, aspect: 2, near: 0.1, far: 2000 }
  ): PerspectiveCamera {
    const { aspect, near, far } = cameraParams;
    const position = new THREE.Vector3(100, 100, 600);
    const Rag2Deg = 360 / (Math.PI * 2);
    // 反三角函数返回弧度值，视角高度为画布高度，为了与屏幕像素单位等同
    const fovRad = 2 * Math.atan(this.canvas.clientHeight / 2 / position.z);
    // 转为角度值
    const fovDeg = fovRad * Rag2Deg;
    const camera = new THREE.PerspectiveCamera(fovDeg, aspect, near, far);
    camera.position.set(position.x, position.y, position.z);
    return camera;
  }

  public initDirectionalLight(
    color: Color = new Color(0xffffff),
    intensity = 1
  ): DirectionalLight {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(1000, 1000, 1000);
    return light;
  }

  public initAmbientLight(color: Color = new Color(0xffffff), intensity = 0.3) {
    const light = new THREE.AmbientLight(color, intensity);
    return light;
  }

  public initScene(): Scene {
    const scene = new THREE.Scene();
    return scene;
  }

  public initRenderer(rendererParams: {
    canvas: HTMLCanvasElement;
    clearColor?: Color;
  }): WebGLRenderer {
    const { canvas, clearColor = new Color(0xffffff) } = rendererParams;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setClearColor(clearColor);
    return renderer;
  }

  public initCSS2DRenderer(container: HTMLElement): CSS2DRenderer {
    const css2drenderer = new CSS2DRenderer();
    css2drenderer.domElement.style.position = "absolute";
    css2drenderer.domElement.style.top = "0";
    // css2drenderer.domElement.style.display = 'none';
    container.appendChild(css2drenderer.domElement);
    return css2drenderer;
  }

  public initSkybox(url: string) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      // "https://threejsfundamentals.org/threejs/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg",
      //   "/assets/sky.jpg",
      url,
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(this.renderer, texture);
        // this.scene.background = rt.texture;
        this.scene.background = texture;
      }
    );
  }

  public initStats(container: HTMLElement): Stats {
    const stats = new Stats();
    // 将性能监控屏区显示在左上角
    stats.dom.style.position = "absolute";
    stats.dom.style.bottom = "0px";
    stats.dom.style.zIndex = "100";
    container.appendChild(stats.dom);
    return stats;
  }

  public initOrbitControls(isContinue = true): OrbitControls {
    let controls;
    if (isContinue) {
      // https://blog.csdn.net/wclwksn2019/article/details/105761609
      controls = new OrbitControls(this.camera, this.css2drenderer.domElement);
    } else {
      controls = new OrbitControls(this.camera, this.renderer.domElement);
    }
    controls.target.set(0, 0, 0);
    return controls;
  }

  public resizeRendererToDisplaySize(
    renderer: WebGLRenderer,
    isUseScreenRatio = true
  ) {
    const canvas = renderer.domElement;
    // 设备物理像素与设备独立像素的比例，即设备独立像素*devicePixelRatio=设备真实的物理物理像素
    const pixelRatio = isUseScreenRatio ? window.devicePixelRatio : 1;
    // 以屏幕的分辨率渲染
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // 连续渲染模式
  public continuousRender(callback?: (time: number) => void) {
    const render = (time: number) => {
      if (this.resizeRendererToDisplaySize(this.renderer)) {
        const canvas = this.renderer.domElement;
        this.css2drenderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }
      this.css2drenderer.render(this.scene, this.camera);
      this.renderer.render(this.scene, this.camera);
      // 时间单位规整到秒
      const t = time * 0.001;
      callback && callback(t);
      if (this.mode === "dev") {
        this.stats?.update();
      }
      requestAnimationFrame(render);
    };
    render(0);
  }

  // 辉光渲染模式
  /**
   * UnrealBloomPass的参数
   * 1: 辉光所覆盖的场景大小
   * 2：辉光的强度
   * 3：辉光散发的半径
   * 4：辉光的阈值（场景中的光强大于该值就会产生辉光效果）
   */
  public bloomRender(callback?: (time: number) => void) {
    const renderScene = new RenderPass(this.scene, this.camera);
    // Bloom通道创建
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      3,
      5,
      1
    );
    bloomPass.renderToScreen = true;
    bloomPass.strength = 1.5;
    bloomPass.radius = 0.5;
    bloomPass.threshold = 0.2;

    const composer = new EffectComposer(this.renderer);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(renderScene);
    // 眩光通道bloomPass插入到composer
    composer.addPass(bloomPass);

    const render = (time: number) => {
      if (this.resizeRendererToDisplaySize(this.renderer)) {
        const canvas = this.renderer.domElement;
        this.css2drenderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }
      this.css2drenderer.render(this.scene, this.camera);
      composer.render();
      // this.renderer.render(this.scene, this.camera);
      // 时间单位规整到秒
      const t = time * 0.001;
      callback && callback(t);
      if (this.mode === "dev") {
        this.stats?.update();
      }
      requestAnimationFrame(render);
    };
    render(0);
  }

  // 按需渲染模式:一般用来查看静态模型
  public ondemandRender(callback?: () => void) {
    this.initOrbitControls(false);
    let renderRequested = false;
    const render = () => {
      renderRequested = false;
      if (this.resizeRendererToDisplaySize(this.renderer)) {
        const canvas = this.renderer.domElement;
        this.css2drenderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
      }
      this.controls.enableDamping = true;
      this.controls.update();
      if (this.mode === "dev") {
        this.stats?.update();
      }
      callback && callback();
      this.renderer.render(this.scene, this.camera);
    };
    render();
    const requestRenderIfNotRequested = () => {
      if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(render);
      }
    };
    this.controls.addEventListener("change", requestRenderIfNotRequested);
    window.addEventListener("resize", requestRenderIfNotRequested);
  }
}
