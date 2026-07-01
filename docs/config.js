/* My Memo — 런타임 설정 (자리표시자).
 *
 * 이 파일은 저장소에 커밋되는 "빈" 기본값입니다. token 은 비워 둡니다.
 *
 * GitHub Pages 배포 시(.github/workflows/deploy.yml)에는 repo Secret
 * MYMEMO_WRITE_TOKEN 값이 이 파일의 token 에 주입되어 배포됩니다.
 * (주입된 config.js 는 배포 결과물에만 존재하며 저장소에는 커밋되지 않습니다.)
 *
 * ⚠ 주의: 배포된 config.js 는 공개적으로 내려받을 수 있습니다.
 *   반드시 mymemo 저장소의 Contents: Read and write 로만 범위를 좁힌
 *   fine-grained 토큰만 사용하세요.
 */
window.MYMEMO_CONFIG = {
  owner: "",
  repo: "",
  branch: "",
  token: ""
};
