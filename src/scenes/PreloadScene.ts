import Phaser from 'phaser'
import {
  BGM_KEY,
  BGM_PATHS,
  FOREST_BGM_KEY,
  FOREST_BGM_PATH,
  VOLCANO_BGM_KEY,
  VOLCANO_BGM_PATH,
  RUINS_BGM_KEY,
  RUINS_BGM_PATH,
  AREA_CLEAR_BGM_KEY,
  AREA_CLEAR_BGM_PATH,
  TITLE_BGM_KEY,
  TITLE_BGM_PATH,
  SFX_KEY_ENEMY_BLOCKED,
  SFX_PATH_ENEMY_BLOCKED,
  SFX_KEY_ENEMY_HIT,
  SFX_PATH_ENEMY_HIT,
  SFX_KEY_ENEMY_DEFEAT,
  SFX_PATH_ENEMY_DEFEAT,
  SFX_KEY_PLAYER_FIRE,
  SFX_PATH_PLAYER_FIRE,
  SFX_KEY_GAME_OVER,
  SFX_PATH_GAME_OVER,
  SFX_KEY_LEVEL_UP,
  SFX_PATH_LEVEL_UP,
  SFX_KEY_STAGE_CLEAR,
  SFX_PATH_STAGE_CLEAR,
  SFX_KEY_AREA_CLEAR,
  SFX_PATH_AREA_CLEAR,
  SFX_KEY_MENU_MOVE,
  SFX_PATH_MENU_MOVE,
  SFX_KEY_SHOP_PURCHASE,
  SFX_PATH_SHOP_PURCHASE,
  SFX_KEY_MENU_CANCEL,
  SFX_PATH_MENU_CANCEL,
  GOLD_COIN_SPRITE_KEY,
  GOLD_COIN_SPRITE_PATH,
  GOLD_COIN_FRAME_SIZE,
  UI_LOCK_ICON_KEY,
  UI_LOCK_ICON_PATH,
  TITLE_AREA_ART_PLAINS_KEY,
  TITLE_AREA_ART_PLAINS_PATH,
  TITLE_AREA_ART_FOREST_KEY,
  TITLE_AREA_ART_FOREST_PATH,
  TITLE_AREA_ART_VOLCANO_KEY,
  TITLE_AREA_ART_VOLCANO_PATH,
  TITLE_AREA_ART_DUNGEON_KEY,
  TITLE_AREA_ART_DUNGEON_PATH,
  PLAYER_WALK_SPRITE_KEY,
  PLAYER_WALK_SPRITE_PATH,
  PLAYER_WALK_FRAME_SIZE,
  ENEMY_SLIME_WALK_SPRITE_KEY,
  ENEMY_SLIME_WALK_SPRITE_PATH,
  ENEMY_SLIME_WALK_FRAME_SIZE,
  ENEMY_SNAKE_WALK_SPRITE_KEY,
  ENEMY_SNAKE_WALK_SPRITE_PATH,
  ENEMY_SNAKE_WALK_FRAME_SIZE,
  ENEMY_CHARGER_WALK_SPRITE_KEY,
  ENEMY_CHARGER_WALK_SPRITE_PATH,
  ENEMY_CHARGER_WALK_FRAME_SIZE,
  ENEMY_ARMORED_WALK_SPRITE_KEY,
  ENEMY_ARMORED_WALK_SPRITE_PATH,
  ENEMY_ARMORED_WALK_FRAME_SIZE,
  ENEMY_SLIME_BREATH_SPRITE_KEY,
  ENEMY_SLIME_BREATH_SPRITE_PATH,
  ENEMY_SLIME_MUD_BREATH_SPRITE_KEY,
  ENEMY_SLIME_MUD_BREATH_SPRITE_PATH,
  ENEMY_MUSHROOM_BREATH_SPRITE_KEY,
  ENEMY_MUSHROOM_BREATH_SPRITE_PATH,
  ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_FIRE_BREATH_SPRITE_PATH,
  ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_PATH,
  ENEMY_BURNING_TREE_BREATH_SPRITE_KEY,
  ENEMY_BURNING_TREE_BREATH_SPRITE_PATH,
  ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY,
  ENEMY_ASH_KNIGHT_BREATH_SPRITE_PATH,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_PATH,
  ENEMY_STUMP_BREATH_SPRITE_KEY,
  ENEMY_STUMP_BREATH_SPRITE_PATH,
  ENEMY_BEETLE_BREATH_SPRITE_KEY,
  ENEMY_BEETLE_BREATH_SPRITE_PATH,
  ENEMY_BRANCH_BREATH_SPRITE_KEY,
  ENEMY_BRANCH_BREATH_SPRITE_PATH,
  ENEMY_GRAVESTONE_BREATH_SPRITE_KEY,
  ENEMY_GRAVESTONE_BREATH_SPRITE_PATH,
  ENEMY_BEE_BREATH_SPRITE_KEY,
  ENEMY_BEE_BREATH_SPRITE_PATH,
  ENEMY_BLOCKED_ICON_KEY,
  ENEMY_BLOCKED_ICON_PATH,
  PLAINS_FLOOR_TILESET_KEY,
  PLAINS_FLOOR_TILESET_PATH,
  FLOOR_DETAIL_TILESET_KEY,
  FLOOR_DETAIL_TILESET_PATH,
} from '../GameConstants'

// =============================================================================
// PreloadScene — アセット読み込み用シーン
//
// 役割:
//   本編で使う音声などをあらかじめ読み込み、終わったら TitleScene へ進む。
//   画像スプライトは現状ほぼ Rectangle 描画なので、主に BGM が対象。
//
// 流れ:
//   BootScene → PreloadScene（ここ）→ TitleScene → GameScene
//
// 補足:
//   Phaser は preload() が終わってから create() を呼ぶ。
//   読み込み失敗してもゲームは止めず、警告だけ出して続行する。
//   BGM は MP3 → OGG の順で試し、ブラウザが使える形式を使う。
// =============================================================================
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('アセットの読み込みに失敗:', file.key, file.url)
    })
    // Plains／共通の戦闘中 BGM（Good Time）
    this.load.audio(BGM_KEY, BGM_PATHS)
    // Forest 戦闘 BGM（Ninja Adventure Asset Pack: Melancholia）
    this.load.audio(FOREST_BGM_KEY, FOREST_BGM_PATH)
    // Volcano 戦闘 BGM（Ninja Adventure Asset Pack: The Cave）
    this.load.audio(VOLCANO_BGM_KEY, VOLCANO_BGM_PATH)
    // Dungeon 戦闘 BGM（Ninja Adventure Asset Pack: Dark Castle）
    this.load.audio(RUINS_BGM_KEY, RUINS_BGM_PATH)
    // エリア最終ステージクリア BGM（Ninja Adventure Asset Pack: Temple）
    this.load.audio(AREA_CLEAR_BGM_KEY, AREA_CLEAR_BGM_PATH)
    // タイトル BGM（Ninja Adventure Asset Pack: Adventure Begin）
    this.load.audio(TITLE_BGM_KEY, TITLE_BGM_PATH)
    // 風魔法ヒット（切り付けのザシュっ）
    this.load.audio(SFX_KEY_ENEMY_HIT, SFX_PATH_ENEMY_HIT)
    // 敵撃破（短い・ふわっと消える自作音）
    this.load.audio(SFX_KEY_ENEMY_DEFEAT, SFX_PATH_ENEMY_DEFEAT)
    // 盾・装甲で攻撃を防いだ音（Voice4.wav を OGG 化）
    this.load.audio(SFX_KEY_ENEMY_BLOCKED, SFX_PATH_ENEMY_BLOCKED)
    // プレイヤー弾の発射音（Ninja Adventure Asset Pack: Launch.wav を OGG 化）
    this.load.audio(SFX_KEY_PLAYER_FIRE, SFX_PATH_PLAYER_FIRE)
    // ゲームオーバー音（Ninja Adventure Asset Pack: GameOver4.wav を OGG 化）
    this.load.audio(SFX_KEY_GAME_OVER, SFX_PATH_GAME_OVER)
    // レベルアップ音（Ninja Adventure Asset Pack: LevelUp3.wav を OGG 化）
    this.load.audio(SFX_KEY_LEVEL_UP, SFX_PATH_LEVEL_UP)
    // ステージクリア音（Ninja Adventure Asset Pack: Success4.wav を OGG 化）
    this.load.audio(SFX_KEY_STAGE_CLEAR, SFX_PATH_STAGE_CLEAR)
    // エリアクリア音（Ninja Adventure Asset Pack: LevelUp2.wav を OGG 化）
    this.load.audio(SFX_KEY_AREA_CLEAR, SFX_PATH_AREA_CLEAR)
    // タイトルのメニュー移動音（Ninja Adventure Asset Pack: Move2.wav を OGG 化）
    this.load.audio(SFX_KEY_MENU_MOVE, SFX_PATH_MENU_MOVE)
    // ショップ購入音（Ninja Adventure Asset Pack: Accept5.wav を OGG 化）
    this.load.audio(SFX_KEY_SHOP_PURCHASE, SFX_PATH_SHOP_PURCHASE)
    // メニューを戻る音（Ninja Adventure Asset Pack: Cancel2.wav を OGG 化）
    this.load.audio(SFX_KEY_MENU_CANCEL, SFX_PATH_MENU_CANCEL)
    // ステージクリア用ゴールドコイン（4コマ回転）
    this.load.spritesheet(GOLD_COIN_SPRITE_KEY, GOLD_COIN_SPRITE_PATH, {
      frameWidth: GOLD_COIN_FRAME_SIZE,
      frameHeight: GOLD_COIN_FRAME_SIZE,
    })
    // タイトルなどのロック表示用南京錠（白スプライトを tint で色付け）
    this.load.image(UI_LOCK_ICON_KEY, UI_LOCK_ICON_PATH)
    // タイトルのエリア選択パネル用イラスト
    this.load.image(TITLE_AREA_ART_PLAINS_KEY, TITLE_AREA_ART_PLAINS_PATH)
    this.load.image(TITLE_AREA_ART_FOREST_KEY, TITLE_AREA_ART_FOREST_PATH)
    this.load.image(TITLE_AREA_ART_VOLCANO_KEY, TITLE_AREA_ART_VOLCANO_PATH)
    this.load.image(TITLE_AREA_ART_DUNGEON_KEY, TITLE_AREA_ART_DUNGEON_PATH)
    // プレイヤーの向き用スプライトシート（正面・横・背中の3コマ。歩行なし）
    this.load.spritesheet(PLAYER_WALK_SPRITE_KEY, PLAYER_WALK_SPRITE_PATH, {
      frameWidth: PLAYER_WALK_FRAME_SIZE,
      frameHeight: PLAYER_WALK_FRAME_SIZE,
    })
    // 最初の近接敵（スライム）の歩行スプライトシート
    this.load.spritesheet(ENEMY_SLIME_WALK_SPRITE_KEY, ENEMY_SLIME_WALK_SPRITE_PATH, {
      frameWidth: ENEMY_SLIME_WALK_FRAME_SIZE,
      frameHeight: ENEMY_SLIME_WALK_FRAME_SIZE,
    })
    // 近接スライムの呼吸アニメ用・静止PNG（黒枠は実行時に重ねる）
    this.load.image(ENEMY_SLIME_BREATH_SPRITE_KEY, ENEMY_SLIME_BREATH_SPRITE_PATH)
    // Plains Stage2 の少し硬い泥スライム
    this.load.image(ENEMY_SLIME_MUD_BREATH_SPRITE_KEY, ENEMY_SLIME_MUD_BREATH_SPRITE_PATH)
    // Forest Stage1 のキノコ（緑スライムと同じステータス）
    this.load.image(ENEMY_MUSHROOM_BREATH_SPRITE_KEY, ENEMY_MUSHROOM_BREATH_SPRITE_PATH)
    // Volcano Stage1 の火の精霊（緑スライムと同じステータス）
    this.load.image(ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY, ENEMY_SPIRIT_FIRE_BREATH_SPRITE_PATH)
    // Volcano Stage2 の雷の精霊（HP3・プレイヤー初期速度）
    this.load.image(
      ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY,
      ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_PATH,
    )
    // Volcano Stage3 の燃え木（HP8・火の精霊をスポーン）
    this.load.image(
      ENEMY_BURNING_TREE_BREATH_SPRITE_KEY,
      ENEMY_BURNING_TREE_BREATH_SPRITE_PATH,
    )
    // Volcano Stage4 の灰騎士（HP6・最初の2発はシールド）
    this.load.image(
      ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY,
      ENEMY_ASH_KNIGHT_BREATH_SPRITE_PATH,
    )
    // Volcano Stage5 の混沌エレメンタル（HP50・下位ステージの敵をスポーン）
    this.load.image(
      ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
      ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_PATH,
    )
    // Forest Stage2 の切り株（泥スライム相当・キノコをスポーン）
    this.load.image(ENEMY_STUMP_BREATH_SPRITE_KEY, ENEMY_STUMP_BREATH_SPRITE_PATH)
    // Forest Stage3 のカブトムシ
    this.load.image(ENEMY_BEETLE_BREATH_SPRITE_KEY, ENEMY_BEETLE_BREATH_SPRITE_PATH)
    // Forest Stage4 の枝
    this.load.image(ENEMY_BRANCH_BREATH_SPRITE_KEY, ENEMY_BRANCH_BREATH_SPRITE_PATH)
    // Forest Stage5 の墓石（動かない・カブトムシを出す）
    this.load.image(ENEMY_GRAVESTONE_BREATH_SPRITE_KEY, ENEMY_GRAVESTONE_BREATH_SPRITE_PATH)
    // 射撃敵（蜂）の呼吸アニメ用・静止PNG（黒枠は実行時に重ねる）
    this.load.image(ENEMY_BEE_BREATH_SPRITE_KEY, ENEMY_BEE_BREATH_SPRITE_PATH)
    // 弾を発射する射撃敵の歩行スプライトシート
    this.load.spritesheet(ENEMY_SNAKE_WALK_SPRITE_KEY, ENEMY_SNAKE_WALK_SPRITE_PATH, {
      frameWidth: ENEMY_SNAKE_WALK_FRAME_SIZE,
      frameHeight: ENEMY_SNAKE_WALK_FRAME_SIZE,
    })
    // 突進敵の歩行スプライトシート
    this.load.spritesheet(
      ENEMY_CHARGER_WALK_SPRITE_KEY,
      ENEMY_CHARGER_WALK_SPRITE_PATH,
      {
        frameWidth: ENEMY_CHARGER_WALK_FRAME_SIZE,
        frameHeight: ENEMY_CHARGER_WALK_FRAME_SIZE,
      },
    )
    // 防御力がある装甲敵の歩行スプライトシート
    this.load.spritesheet(
      ENEMY_ARMORED_WALK_SPRITE_KEY,
      ENEMY_ARMORED_WALK_SPRITE_PATH,
      {
        frameWidth: ENEMY_ARMORED_WALK_FRAME_SIZE,
        frameHeight: ENEMY_ARMORED_WALK_FRAME_SIZE,
      },
    )
    // 盾・装甲で通常弾を防いだときに表示するアイコン
    this.load.image(ENEMY_BLOCKED_ICON_KEY, ENEMY_BLOCKED_ICON_PATH)
    // Plains / Forest の床タイルシート（縦に5色）
    this.load.image(PLAINS_FLOOR_TILESET_KEY, PLAINS_FLOOR_TILESET_PATH)
    // 床の装飾タイル（枝・草・葉など。Forest の背景に散らす）
    this.load.image(FLOOR_DETAIL_TILESET_KEY, FLOOR_DETAIL_TILESET_PATH)
  }

  create(): void {
    this.scene.start('TitleScene')
  }
}
