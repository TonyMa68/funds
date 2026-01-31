# GitHub Secrets 配置示例

这个文件展示了如何在GitHub仓库中配置Secrets，用于GitHub Actions自动运行。

## 需要配置的Secrets

### 1. TELEGRAM_BOT_TOKEN

**说明：** Telegram Bot的访问令牌

**获取方式：**
1. 在Telegram搜索 `@BotFather`
2. 发送 `/newbot` 创建新机器人
3. 获得Token

**示例值：**
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**在GitHub中添加：**
1. 仓库页面 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. Name: `TELEGRAM_BOT_TOKEN`
4. Secret: 粘贴您的Token
5. 点击 "Add secret"

---

### 2. TELEGRAM_CHAT_ID

**说明：** 接收消息的Telegram账户ID

**获取方式：**

方法一：使用 @userinfobot
1. 在Telegram搜索 `@userinfobot`
2. 向它发送任意消息
3. 机器人会返回您的ID

方法二：使用API
1. 向您的Bot发送一条消息
2. 访问: `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
3. 在JSON响应中找到 `"chat":{"id":123456789}`

**示例值：**
```
123456789
```

**在GitHub中添加：**
1. 仓库页面 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. Name: `TELEGRAM_CHAT_ID`
4. Secret: 粘贴您的Chat ID
5. 点击 "Add secret"

---

### 3. FUND_LIST

**说明：** 要监控的基金列表（JSON数组格式）

**格式要求：**
- 必须是有效的JSON数组
- 每个基金包含 code、name、shares 字段
- shares 为 0 表示只监控不计算收益

**示例值：**
```json
[
  {
    "code": "001186",
    "name": "富国文体健康",
    "shares": 1000
  },
  {
    "code": "110022",
    "name": "易方达消费行业",
    "shares": 500
  },
  {
    "code": "163406",
    "name": "兴全合润",
    "shares": 800
  },
  {
    "code": "161725",
    "name": "招商中证白酒",
    "shares": 0
  }
]
```

**字段说明：**
- `code`: 基金代码（6位数字，必填）
- `name`: 基金名称（可选，仅用于备注）
- `shares`: 持有份额（数字，0表示只监控）

**在GitHub中添加：**
1. 仓库页面 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. Name: `FUND_LIST`
4. Secret: 粘贴上面的JSON内容（确保格式正确）
5. 点击 "Add secret"

**注意事项：**
- JSON格式必须严格正确，否则工作流会失败
- 建议使用 [JSONLint](https://jsonlint.com/) 验证格式
- 不要有多余的逗号
- 确保括号匹配

---

## 验证配置

配置完成后：

1. 进入仓库的 Actions 标签页
2. 选择 "每日基金推送到Telegram" 工作流
3. 点击 "Run workflow" 手动运行
4. 查看运行日志，确认配置是否正确

如果出现错误：
- 检查Token和Chat ID是否正确
- 验证JSON格式是否有效
- 确认已向Bot发送过至少一条消息

---

## 修改Secrets

如果需要修改已配置的Secrets：

1. 仓库页面 → Settings → Secrets and variables → Actions
2. 找到要修改的Secret
3. 点击 "Update" 按钮
4. 输入新值
5. 点击 "Update secret"

---

## 安全提示

- ⚠️ 不要将Secrets提交到代码仓库
- ⚠️ 不要在公开场合分享您的Token和Chat ID
- ⚠️ 定期检查并更新Bot Token
- ✅ GitHub Secrets是加密存储的，只有工作流可以访问

---

## 常见问题

**Q: Secret名称区分大小写吗？**
A: 是的，必须完全一致，包括大小写。

**Q: 可以在多个仓库使用同一个Bot吗？**
A: 可以，但需要在每个仓库分别配置Secrets。

**Q: 如何监控更多基金？**
A: 编辑 `FUND_LIST` Secret，添加更多基金到JSON数组中。

**Q: 如果不想计算某个基金的收益怎么办？**
A: 将该基金的 `shares` 设为 0。
