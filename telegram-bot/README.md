# 基金Telegram推送服务

自动推送每天基金涨跌情况到Telegram的服务。本服务基于原项目的基金数据API，实现了定时推送基金估值、涨跌幅、收益等信息到Telegram。

## 功能特性

- ✅ 自动获取基金实时估值数据（使用天天基金API）
- ✅ 支持多只基金同时监控
- ✅ 自动计算持仓收益和总收益
- ✅ 定时推送（支持自定义时间）
- ✅ 自动识别交易日，休市日不推送
- ✅ 支持份额配置，自动计算收益
- ✅ 美观的消息格式，包含emoji图标
- ✅ 区分已更新净值和估值
- ✅ 支持GitHub Actions自动运行（无需服务器）

## 部署方式选择

### 方式一：GitHub Actions（推荐）

**优点：**
- ✅ 完全免费，无需服务器
- ✅ 自动运行，无需维护
- ✅ 配置简单，只需设置Secrets
- ✅ 可随时查看运行日志

**缺点：**
- ❌ 依赖GitHub服务
- ❌ cron调度可能延迟5-15分钟

**配置指南：** [../.github/ACTIONS_SETUP.md](../.github/ACTIONS_SETUP.md)

### 方式二：本地/服务器运行

**优点：**
- ✅ 完全自主控制
- ✅ 运行时间精确
- ✅ 可扩展更多功能

**缺点：**
- ❌ 需要服务器或保持电脑运行
- ❌ 需要手动维护

**配置指南：** 见下文"本地运行配置"

---

## GitHub Actions 配置（方式一）

详细配置步骤请查看：[../.github/ACTIONS_SETUP.md](../.github/ACTIONS_SETUP.md)

**快速步骤：**

1. Fork本仓库到您的GitHub账号
2. 在仓库Settings → Secrets中添加：
   - `TELEGRAM_BOT_TOKEN`: 您的Bot Token
   - `TELEGRAM_CHAT_ID`: 您的Chat ID
   - `FUND_LIST`: 基金列表（JSON格式）
3. 在Actions标签页启用工作流
4. 手动运行一次测试

完成！系统将自动在每个工作日早9:00和下午3:30推送消息。

---

## 本地运行配置（方式二）

### 1. 创建Telegram Bot

1. 在Telegram中搜索 `@BotFather`
2. 发送 `/newbot` 命令创建新机器人
3. 按提示设置机器人名称
4. 保存获得的 `Bot Token`（格式如：`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

### 2. 获取Chat ID

1. 在Telegram中搜索 `@userinfobot`
2. 向其发送任意消息
3. 机器人会返回你的 `Chat ID`（纯数字）

或者使用你创建的bot：
1. 在Telegram中找到你创建的机器人并向它发送任意消息
2. 访问 `https://api.telegram.org/bot<YourBOTToken>/getUpdates`
3. 在返回的JSON中找到 `"chat":{"id":123456789}` 中的ID

### 3. 安装依赖

```bash
cd telegram-bot
npm install
```

### 4. 配置文件

复制配置示例文件并修改：

```bash
cp config.example.json config.json
```

编辑 `config.json` 文件：

```json
{
  "telegram": {
    "botToken": "你的Bot Token",
    "chatId": "你的Chat ID"
  },
  "schedule": {
    "morningReport": "0 9 0 * * 1-5",
    "afternoonReport": "0 15 30 * * 1-5"
  },
  "funds": [
    {
      "code": "001186",
      "name": "富国文体健康",
      "shares": 1000
    },
    {
      "code": "110022",
      "name": "易方达消费行业",
      "shares": 500
    }
  ]
}
```

**配置说明：**

- `telegram.botToken`: Telegram机器人令牌
- `telegram.chatId`: 接收消息的聊天ID
- `schedule.morningReport`: 早报时间（默认每个工作日上午9:00）
- `schedule.afternoonReport`: 午报时间（默认每个工作日下午3:30）
- `funds`: 要监控的基金列表
  - `code`: 基金代码（6位数字）
  - `name`: 基金名称（可选，仅用于备注）
  - `shares`: 持有份额（设为0表示仅监控不计算收益）

**定时任务格式说明（Cron表达式）：**

格式：`秒 分 时 日 月 星期`

- `0 0 9 * * 1-5` = 每周一到周五的上午9:00
- `0 30 15 * * 1-5` = 每周一到周五的下午3:30

### 5. 运行服务

**测试运行（立即发送一次）：**

```bash
npm test
# 或
node index.js --now
```

**启动定时服务：**

```bash
npm start
# 或
node index.js
```

**使用PM2持久化运行（推荐）：**

```bash
# 安装PM2（如未安装）
npm install -g pm2

# 启动服务
pm2 start index.js --name funds-telegram

# 查看日志
pm2 logs funds-telegram

# 设置开机自启
pm2 startup
pm2 save

# 停止服务
pm2 stop funds-telegram

# 重启服务
pm2 restart funds-telegram
```

## 消息示例

**推送消息预览：**

![Telegram消息预览](https://github.com/user-attachments/assets/d67c2cad-f67b-4acb-bb25-094e132557a2)

推送的消息格式示例：

```
📊 基金每日报告
📅 2024/1/31 15:30

📈 富国文体健康 ✅
   代码: 001186
   净值: 1.5230 → 1.5380
   涨跌: +0.98%
   持仓: 1000份
   收益: +15.00元

📉 易方达消费行业
   代码: 110022
   净值: 3.2150 → 3.1890
   涨跌: -0.81%
   持仓: 500份
   收益: -13.00元

━━━━━━━━━━━━━━━
📊 汇总统计
   上涨: 1只 | 下跌: 1只
   总持仓: 3.13万元
   总收益: +2.00元
   收益率: +0.06%
```

**说明：**
- 📈 表示上涨，📉 表示下跌
- ✅ 表示当日净值已更新（收盘后）
- 无✅ 表示使用实时估值

## 技术实现

### API接口

本服务使用与原Chrome扩展项目相同的API接口：

```
https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo
```

**参数说明：**
- `Fcodes`: 基金代码列表（逗号分隔）
- `deviceid`: 设备ID（自动生成）

**返回数据字段：**
- `FCODE`: 基金代码
- `SHORTNAME`: 基金简称
- `NAV`: 单位净值
- `GSZ`: 估算净值
- `GSZZL`: 估算涨跌幅
- `NAVCHGRT`: 实际涨跌幅
- `PDATE`: 净值日期
- `GZTIME`: 估值时间

### 收益计算逻辑

与原项目保持一致的计算方式：

1. **已更新净值情况**（`PDATE == GZTIME日期`）：
   ```javascript
   收益 = (当前净值 - 当前净值 / (1 + 涨跌幅 * 0.01)) * 持有份额
   ```

2. **使用估值情况**：
   ```javascript
   收益 = (估算净值 - 单位净值) * 持有份额
   ```

### 交易日判断

- 自动排除周末（周六、周日）
- 可扩展节假日判断（参考原项目的holiday.json）

## 常见问题

### Q: 如何找到基金代码？

A: 可以在以下网站搜索：
- 天天基金网：https://fund.eastmoney.com/
- 在搜索结果中，基金代码是6位数字

### Q: 为什么有些基金显示"--"？

A: 部分新发基金或QDII基金可能无法获取实时估值数据，这是正常现象。

### Q: 可以监控多少只基金？

A: 理论上没有限制，但建议不超过50只，以保证消息的可读性。

### Q: 定时任务不执行怎么办？

A: 
1. 检查服务是否正常运行
2. 检查cron表达式是否正确
3. 确认当前是交易日（周一到周五）
4. 查看控制台日志

### Q: 如何修改推送时间？

A: 修改 `config.json` 中的 `schedule` 配置，使用标准cron表达式。

### Q: 消息发送失败怎么办？

A: 
1. 检查Bot Token是否正确
2. 检查Chat ID是否正确
3. 确认已向bot发送过至少一条消息
4. 检查网络连接

## Docker部署（可选）

创建 `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

构建和运行：

```bash
docker build -t funds-telegram-bot .
docker run -d --name funds-bot \
  -v $(pwd)/config.json:/app/config.json \
  funds-telegram-bot
```

## 依赖说明

- `axios`: HTTP客户端，用于请求基金API
- `node-telegram-bot-api`: Telegram Bot API封装
- `node-cron`: 定时任务调度

## 许可证

GPL-3.0 License

## 贡献

欢迎提交Issue和Pull Request！

## 相关项目

- [原Chrome扩展项目](https://github.com/x2rr/funds)

## 免责声明

本项目仅供学习交流使用，基金数据来自公开API，不保证数据的准确性和实时性。投资有风险，决策需谨慎。
