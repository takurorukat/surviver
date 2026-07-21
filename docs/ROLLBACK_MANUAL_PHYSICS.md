# 手動座標更新方式（ロールバック用メモ）

2026年時点で **Phaser velocity + fixedStep 方式** に移行済み。

以前の方式に戻す場合は、このコミットより前の git 履歴を参照するか、以下の特徴を持つコードに戻す。

## 旧方式の特徴

- 移動: `body.moves = false` + `setPosition` 直接更新
- 弾当たり: `BulletHitSystem` の距離計算
- 速度安定: `PLAYER_MOVEMENT_FIXED_STEP_SECONDS` で手動キャップ
- ファイル: `BulletHitSystem.ts` が存在

## 現行方式（Phaser 任せ）

- 移動: `body.setVelocity` + `fixedStep: true`（60fps）
- 当たり判定: `physics.add.overlap` すべて
- 設定: `main.ts` の `arcade.fps` / `arcade.fixedStep`
