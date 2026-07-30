/**
 * 外部支援リンクは、ビルド時に文字列 "true" が明示された場合だけ有効。
 * 配信先やブラウザ情報から自動判定しない。
 *
 * 有効化は配信先の公式規約を人間が確認したうえで
 * `VITE_SURVIVOR_SUPPORT_LINK_ENABLED=true` を付けてビルドする。
 * コードは各プラットフォームの可否を保証しない。規約変更時はビルドを OFF にする。
 */
export const SURVIVOR_SUPPORT_LINK_ENABLED =
  import.meta.env.VITE_SURVIVOR_SUPPORT_LINK_ENABLED === 'true'

export const SUPPORT_DEVELOPER_LABEL = 'SUPPORT DEVELOPER'

/** 環境変数の厳密判定を単体テストするための純粋関数。 */
export function isSupportDeveloperLinkEnabled(rawValue: unknown): boolean {
  return rawValue === 'true'
}
