# Contributing

感谢你愿意改进 Text File Editor。

## 开发流程

1. Fork 或 clone 仓库。
2. 安装依赖：

   ```bash
   npm install
   ```

3. 修改代码后运行验证：

   ```bash
   npm run test
   npm run typecheck
   npm run build
   ```

4. 提交 PR 时，请说明改动目的、验证结果和可能影响的文件类型。

## 代码约定

- 优先保持插件轻量，避免无必要的大依赖。
- 涉及读取、保存、编码、大文件等行为时，需要补充测试。
- 用户可见的错误提示需要尽量清晰，说明下一步该怎么处理。

## Release

推送形如 `v1.0.0` 的 tag 后，GitHub Actions 会自动构建并上传插件 zip。
