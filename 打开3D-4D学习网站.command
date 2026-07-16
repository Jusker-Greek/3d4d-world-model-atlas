#!/bin/zsh

cd "$(dirname "$0")" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "没有找到 Node.js / npm，请先安装 Node.js 22 或更高版本。"
  echo "按任意键关闭窗口。"
  read -k 1
  exit 1
fi

(
  until curl -fsS http://localhost:3000/ >/dev/null 2>&1; do
    sleep 1
  done
  open http://localhost:3000/
) &

echo "正在启动 3D / 4D World Model 学习地图……"
echo "网站打开后请保留这个窗口；关闭窗口会停止本地网站。"
echo
npm run dev
