/**
 * CLI 入口。--check なら非破壊検査のみ（Tone / 音声 I/O を起動しない）。
 */

const isCheck = process.argv.includes('--check')

if (isCheck) {
  const { runCheck } = await import('./check.ts')
  const code = await runCheck()
  process.exit(code)
} else {
  // 生成パイプライン（Tone.Offline → バックアップ → 正式配置）
  await import('./generate.ts')
}
