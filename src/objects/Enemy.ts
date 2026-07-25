/**
 * 敵のスポーン・ダメージ・撃破演出・HP バー。
 *
 * 実装は `./enemy/` 以下に分割。このファイルは互換用の再エクスポート。
 * 呼び出し元はこれまで通り `../objects/Enemy` から import できる。
 *
 * 注意: macOS では `./enemy` と `Enemy.ts` の大文字小文字が衝突するため、
 * 必ず `./enemy/index` を指定する。
 */
export * from './enemy/index'
