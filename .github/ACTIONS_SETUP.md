# GitHub Actions 自动运行配置指南

本指南将帮助您配置GitHub Actions，实现自动定时推送基金通知到Telegram。

## 功能说明

GitHub Actions工作流会在以下时间自动运行：
- **早报**：每个工作日上午 9:00 (北京时间)
- **午报**：每个工作日下午 3:30 (北京时间)
- **手动触发**：可以随时在GitHub网页上手动运行

## 配置步骤

### 1. 创建Telegram Bot

如果还没有创建Bot，请参考 [telegram-bot/README.md](../telegram-bot/README.md) 中的说明创建Bot并获取：
- `Bot Token`
- `Chat ID`

### 2. 配置GitHub Secrets

在GitHub仓库中添加以下Secrets：

1. 进入仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret` 添加以下secrets：

#### TELEGRAM_BOT_TOKEN
您的Telegram Bot Token，格式如：
```
123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

#### TELEGRAM_CHAT_ID
您的Telegram Chat ID，格式如：
```
123456789
```

#### FUND_LIST
要监控的基金列表（JSON数组格式），例如：
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
  }
]
```

**注意事项：**
- JSON格式必须正确，可以使用在线JSON验证工具检查
- `shares` 设为 0 表示只监控不计算收益
- `name` 字段是可选的，仅用于备注

### 3. 启用GitHub Actions

1. 进入仓库的 `Actions` 标签页
2. 如果Actions被禁用，点击 `I understand my workflows, go ahead and enable them`
3. 找到 `每日基金推送到Telegram` 工作流
4. 点击 `Enable workflow`

### 4. 手动测试运行

首次配置后，建议手动运行一次测试：

1. 进入 `Actions` 标签页
2. 选择 `每日基金推送到Telegram` 工作流
3. 点击右侧的 `Run workflow` 按钮
4. 选择分支（通常是main或master）
5. 点击 `Run workflow` 确认

查看运行日志，确认是否成功发送消息到Telegram。

## 工作流说明

### 触发时间

工作流使用UTC时间配置cron表达式：
- 早报：`0 1 * * 1-5` (UTC 01:00 = 北京时间 09:00)
- 午报：`30 7 * * 1-5` (UTC 07:30 = 北京时间 15:30)

只在工作日（周一到周五）运行。

### 执行步骤

1. **检出代码**：从仓库获取最新代码
2. **设置Node.js**：安装Node.js 16环境
3. **安装依赖**：安装telegram-bot所需的npm包
4. **创建配置文件**：使用Secrets创建config.json
5. **发送通知**：运行bot发送Telegram消息

### 环境变量

- `TZ: Asia/Shanghai` - 设置时区为上海，确保时间判断正确

## 查看运行历史

1. 进入 `Actions` 标签页
2. 选择 `每日基金推送到Telegram` 工作流
3. 查看历史运行记录
4. 点击任意运行记录查看详细日志

## 故障排查

### 工作流没有按时运行

**原因：**
- GitHub Actions的cron调度可能延迟5-15分钟
- 仓库长期没有活动可能导致Actions被禁用

**解决方法：**
- 耐心等待，通常会在计划时间后15分钟内执行
- 定期手动触发或有新的提交可以保持活跃

### 提示 "Secrets 未配置"

**解决方法：**
- 检查Secrets名称是否完全一致（区分大小写）
- 确认已在正确的仓库中配置Secrets

### JSON格式错误

**现象：**
工作流在"创建配置文件"步骤失败

**解决方法：**
- 检查 `FUND_LIST` secret的JSON格式
- 确保没有多余的逗号、括号匹配
- 使用 [JSONLint](https://jsonlint.com/) 验证

### Bot无法发送消息

**检查项：**
1. `TELEGRAM_BOT_TOKEN` 是否正确
2. `TELEGRAM_CHAT_ID` 是否正确
3. 是否已向Bot发送过至少一条消息
4. Bot是否有发送消息的权限

### 今天不是交易日

**现象：**
日志显示 "今天不是交易日，跳过报告。"

**说明：**
- 这是正常行为
- 周末和节假日会自动跳过
- 可以通过手动触发来测试（即使在非交易日也会发送）

## 修改推送时间

如果需要修改推送时间，编辑 `.github/workflows/telegram-notification.yml` 文件中的cron表达式：

```yaml
on:
  schedule:
    # 修改为您想要的时间（注意使用UTC时间）
    - cron: '0 1 * * 1-5'  # 北京时间 09:00
    - cron: '30 7 * * 1-5' # 北京时间 15:30
```

**UTC时间转换：**
- 北京时间 = UTC时间 + 8小时
- UTC时间 = 北京时间 - 8小时

例如：
- 北京时间 10:00 → UTC 02:00 → cron: `0 2 * * 1-5`
- 北京时间 16:00 → UTC 08:00 → cron: `0 8 * * 1-5`

## 禁用自动运行

如果需要临时禁用自动运行：

1. 进入 `Actions` 标签页
2. 选择 `每日基金推送到Telegram` 工作流
3. 点击右上角的 `...` 菜单
4. 选择 `Disable workflow`

需要时可以再次启用。

## 高级配置

### 添加更多基金

编辑 `FUND_LIST` secret，添加更多基金到JSON数组中。

### 使用不同的Telegram账户

修改 `TELEGRAM_CHAT_ID` secret为其他账户的Chat ID。

### 创建多个推送任务

可以复制工作流文件，创建不同时间、不同配置的多个推送任务。

## 成本说明

GitHub Actions对公共仓库完全免费。对于私有仓库：
- 免费额度：每月2000分钟
- 本工作流每次运行约1-2分钟
- 每天2次 × 30天 = 60次/月，约60-120分钟/月

在免费额度内完全够用。

## 相关文档

- [Telegram Bot 使用指南](../telegram-bot/README.md)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [Cron 表达式说明](https://crontab.guru/)
