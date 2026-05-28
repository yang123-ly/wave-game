# PRD - 浪尖踏歌 WaveDash

## 一、产品定位
基于 Three.js GPGPU 水面技术的双人对战小游戏，玩法核心是"在动态变化的浪头之间跳跃"。

- **玩法类型**：同屏轮流回合制
- **目标用户**：DuoDash 现有玩家（已有云上之巅、跳一跳）
- **差异化**：业界首个把 GPGPU 物理水面做成跳跃落点的游戏

## 二、核心玩法

### 回合流程
1. 游戏开始：3 秒倒计时
2. 海面隆起 4-6 个浪头（每个浪头是水面叠加的高斯凸起，顶部发光圈标记）
3. **当前回合玩家**点击任一浪头 → 角色抛物线飞跃过去
4. 落点判定：
   - 命中浪头中心半径 1.2 内 → 普通命中 **+10 分**
   - 命中浪头中心半径 0.6 内 → 完美命中 **+20 分**
   - 落空 → **-5 分**
5. 落地瞬间向 GPGPU 水面注入扰动 → 涟漪向外扩散
6. 当前浪头崩塌（缩小消失），1.5 秒后所有浪头重新随机生成
7. 切换玩家回合 → 重复，共 **5 回合 × 2 玩家 = 10 跳**
8. 最高分获胜

### 操作
| 操作 | 行为 |
|---|---|
| 鼠标悬停浪头 | 浪头高亮 + 显示预估距离 |
| 鼠标点击浪头 | 当前玩家跳过去 |
| 8 秒超时 | 自动 pass，记 -1 分 |

### 计分公式
```
基础分 = 完美命中 ? 20 : (命中 ? 10 : -5)
距离加成 = floor(distance / 5)  // 远跳奖励
连击加成 = 连续命中 N 次 → ×(1 + 0.2 × min(N, 5))
最终 = (基础分 + 距离加成) × 连击倍数
```

## 三、技术架构

### 文件结构
```
frontend/src/
├── engine_wave/
│   ├── types.ts          # Player, WaveTarget, GamePhase 类型
│   ├── constants.ts      # 水面参数、玩法常量
│   └── waveStore.ts      # zustand 全局 store
├── components_wave/
│   ├── WaterSurface.tsx  # ⭐ GPGPU 水面（核心难点）
│   ├── WaveTarget.tsx    # 浪头：发光圈 + 点击 raycaster
│   ├── WavePlayer.tsx    # 当前玩家发光小人 + 跳跃动画
│   ├── WaveCanvas.tsx    # 总组装
│   └── WaveHUD.tsx       # 双方计分 + 回合提示
└── pages/
    └── WaveGamePage.tsx  # 路由 /wave/:roomId
```

### GPGPU 水面（核心）
移植 Three.js 官方 `webgl_gpgpu_water` 示例：
- **GPUComputationRenderer** 维护两张纹理：heightmap + 上一帧 heightmap
- 每帧 `compute()` 跑 `heightmapFragmentShader`，模拟波动方程：`y[t+1] = 2y[t] - y[t-1] + c² × laplacian(y[t]) × damping`
- 水面 ShaderMaterial 的顶点着色器读取 heightmap 来位移 Y
- 玩家落地时调用 `setDrop(uv, strength)` → 把扰动写入 heightmap 局部区域 → 涟漪自然传播

### 同屏轮流（与现有跳一跳一致）
- store 维护 `currentPlayer: 'p1' | 'p2'`
- 每跳完一次自动 toggle
- 不接后端，纯前端

## 四、不做的事
- ❌ 联机
- ❌ 后端持久化
- ❌ 排行榜接入
- ❌ 粒子水花（GPGPU 涟漪已足够）
- ❌ 音效（后续迭代）

## 五、验收
- [ ] 水面持续起伏，鼠标拖动相机能看到全貌
- [ ] 浪头清晰可见、可点击
- [ ] 玩家跳跃抛物线流畅（0.8s）
- [ ] 落地涟漪从落点向外扩散
- [ ] HUD 实时显示双方分数 + 回合 + 倒计时
- [ ] 10 跳后跳转到 ResultPage 显示胜负
