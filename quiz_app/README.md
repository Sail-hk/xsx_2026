# 习思想刷题程序

这是一个可离线打开、也可直接部署到 GitHub Pages 的刷题网页，适合自己用，也适合直接发给同学使用。

## 直接使用

双击 [index.html](/C:/Users/k/Desktop/习思想/quiz_app/index.html) 即可开始刷题。

## GitHub Pages 部署

这个项目已经是纯静态网页，不需要后端。

1. 把整个仓库推到 GitHub。
2. 默认分支使用 `main`。
3. 在 GitHub 仓库的 `Settings -> Pages` 中确认 `GitHub Actions` 为部署来源。
4. 推送后，工作流 `.github/workflows/deploy-pages.yml` 会自动把 `quiz_app` 目录发布成在线页面。

上线后，你把链接发给同学即可直接在线刷题。

## 题库更新

如果 `题库` 文件夹里的 `.docx` 有新增或替换，运行下面这条命令重建数据：

```powershell
& 'C:\Users\k\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' .\build_question_bank.py
```

运行目录：

```powershell
cd C:\Users\k\Desktop\习思想\quiz_app
```

生成后的 `questions-data.js` 会被网页自动读取。
