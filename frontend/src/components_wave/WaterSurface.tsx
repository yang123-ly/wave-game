/**
 * 浪尖踏歌 - 海洋水面 + 天空
 * 使用 Three.js 官方 Water.js（WebGL 版）+ Sky.js
 * 效果类似 https://threejs.org/examples/#webgpu_ocean
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
// @ts-ignore
import { Water } from 'three/examples/jsm/objects/Water.js';
// @ts-ignore
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const WaterSurface: React.FC = () => {
  const { scene, gl } = useThree();
  const waterRef = useRef<any>(null);

  /** 太阳方向（用于 Sky + Water 联动） */
  const sun = useMemo(() => new THREE.Vector3(), []);

  /* ============ 创建 Water ============ */
  const water = useMemo(() => {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const waterNormals = new THREE.TextureLoader().load('/textures/waternormals.jpg', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    });
    const waterMesh = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    });
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0;
    return waterMesh;
  }, []);

  /* ============ 创建 Sky ============ */
  const sky = useMemo(() => {
    const skyMesh = new Sky();
    skyMesh.scale.setScalar(10000);
    return skyMesh;
  }, []);

  /* ============ 设置太阳位置 + 环境贴图 ============ */
  useEffect(() => {
    scene.add(water);
    scene.add(sky);
    waterRef.current = water;

    // 太阳参数
    const elevation = 2; // 低角度太阳（日出/日落效果）
    const azimuth = 180;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    // Sky uniforms
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    skyUniforms['sunPosition'].value.copy(sun);

    // Water sun direction
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    // 生成环境贴图（让场景物体反射天空）
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.add(sky.clone());
    const renderTarget = pmremGenerator.fromScene(envScene, 0, 0.1, 1000);
    scene.environment = renderTarget.texture;
    pmremGenerator.dispose();

    return () => {
      scene.remove(water);
      scene.remove(sky);
    };
  }, [scene, gl, water, sky, sun]);

  /* ============ 每帧更新水面 time uniform ============ */
  useFrame((_, dt) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms['time'].value += dt;
    }
  });

  // Water 和 Sky 通过 scene.add 直接加入场景，不需要 JSX 返回
  return null;
};

export default WaterSurface;
