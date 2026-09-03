# Lexiwise · IELTS Vocab Lab

把 IELTS 练习网站导出的词汇 JSON，转成可直接用于阅读、写作和口语训练的词汇档案。

在线版本：[打开 Lexiwise IELTS Vocab Lab](https://lexiwise-ielts-vocab-lab.terryhu4ng.chatgpt.site)

## 能做什么

- 导入一份或多份 IELTS 词汇 JSON；重复词会合并，同时保留多个来源的追溯信息。
- 对当前示例词表的 80 个词提供已审校档案：音标、核心义、CEFR、IELTS 价值、技能适配、搭配、句型、近义词辨析、常见错误，以及写作/口语迁移建议。
- 输入单个单词查询：优先匹配本地已审校词库；可导入自己的 AI 配置，为未收录词生成完整 IELTS 学习档案。未配置或 AI 接口失败时，会降级为公开英语词典补全。
- 按学习优先级、Task 2 输出价值和复习状态筛选；学习状态保存在浏览器本地。
- 朗读单词，并可导出单词档案或整份词表的 JSON。

## 支持的导入格式

```json
{
  "words": [
    {
      "word": "enhance",
      "meaning": "vt. 提高，增强；增进",
      "example": "Investment can enhance the quality of education.",
      "note": "阅读提取：文章标题；本篇出现 1 次；freq 88%",
      "freq": 0.8789
    }
  ],
  "meta": {
    "source": "reading-vocab-selection",
    "examId": "p1-low-106",
    "title": "文章标题",
    "createdAt": "2026-09-02T08:15:41.689Z"
  }
}
```

每个词至少需要 `word` 和 `meaning`。可以一次选择多份 JSON；无法识别的文件会被跳过，不会阻断其他有效文件的导入。

## 分析可信度

页面会显式区分资料质量：

- **已审校 IELTS 档案**：本地整理的核心义、搭配、易错点与输出建议。
- **AI 生成 · 建议核验**：由用户导入的 AI 接口生成的学习档案；不会被表述为官方 IELTS 词频、真题出处或人工审校结论。
- **词典补全 · 建议核对**：公开词典提供释义和发音；IELTS 适配建议仍需结合语境判断。
- **通用分析 · 待核验**：导入来源信息不足时的学习起点，不会伪装成真题频率结论。

导入文件通常不含文章正文；因此“来源文件提供的例句”不一定是文章原句，应用会在界面中清楚提示这一点。

## 导入 AI 配置

页面的「AI 接口」区可以导入一个 JSON 配置。配置仅驻留在当前页面的运行内存中，刷新或点击清除后即失效；不会写入 `localStorage`、GitHub 或本项目文件。

```json
{
  "version": 1,
  "name": "My private AI proxy",
  "endpoint": "https://your-secure-proxy.example/v1/responses",
  "protocol": "responses",
  "model": "your-model-id",
  "apiKey": "YOUR_API_KEY"
}
```

- `protocol` 仅支持 `responses` 或 `chat-completions`，`endpoint` 必须填写对应的完整接口地址。
- 该模式由浏览器直接请求你的接口，因此服务商必须支持 CORS。页面只会向该地址发送当前查询单词、固定的 IELTS 分析提示和 Bearer 凭据。
- 为避免把官方项目密钥暴露在浏览器中，应用拒绝浏览器直连官方 OpenAI 地址。请使用你自己的兼容接口或安全代理，并使用可撤销、限额的密钥。
- 不要将含真实密钥的配置文件提交到 GitHub、上传到网盘公开链接或分享给他人。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

## 项目结构

```text
app/
  page.tsx                       # 主界面、导入、查询、导出与学习状态
  extended-curated-profiles.ts   # 扩展的已审校 IELTS 词汇档案
  globals.css                    # 页面样式
public/
  og.png                         # 分享预览图
```

## 隐私说明

- 已导入的词表和学习状态在当前浏览器会话中处理；学习状态仅写入浏览器 `localStorage`。
- 只有查询未收录单词时，应用才会请求公开词典服务来补全英文释义与发音。
- 导入 AI 配置后，未收录单词会被发送到配置中指定的 AI 接口；API 密钥不持久化，但会作为认证凭据发送给该接口。
