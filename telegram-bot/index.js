const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// 加载配置文件
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
} catch (error) {
  console.error('错误: 无法加载config.json文件。请复制config.example.json并重命名为config.json，然后填入您的配置信息。');
  process.exit(1);
}

// 初始化Telegram Bot
const bot = new TelegramBot(config.telegram.botToken, { polling: false });

// 生成设备ID (与原项目保持一致)
function getGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const deviceId = getGuid();

// 检查是否为交易日
function isDuringDate() {
  const zoneOffset = 8;
  const offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  const nowDate8 = new Date().getTime();
  const curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);
  
  // 检查是否为周末
  if (curDate.getDay() === 6 || curDate.getDay() === 0) {
    return false;
  }
  
  return true;
}

// 获取基金数据 (使用与原项目相同的API)
async function getFundData(fundCodes) {
  const fundStr = fundCodes.join(',');
  const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${deviceId}&Fcodes=${fundStr}`;
  
  try {
    const response = await axios.get(url);
    return response.data.Datas || [];
  } catch (error) {
    console.error('获取基金数据失败:', error.message);
    return [];
  }
}

// 格式化数字
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }
  return parseFloat(num).toFixed(2);
}

// 格式化金额
function formatAmount(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }
  const absNum = Math.abs(num);
  if (absNum < 10000) {
    return num.toFixed(2);
  } else {
    return (num / 10000).toFixed(2) + '万';
  }
}

// 生成基金报告消息
function generateFundReport(fundDataList, configFunds) {
  let message = '📊 *基金每日报告*\n';
  message += `📅 ${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}\n\n`;
  
  let totalGains = 0;
  let totalAmount = 0;
  let upCount = 0;
  let downCount = 0;
  
  fundDataList.forEach((fund, index) => {
    const configFund = configFunds.find(f => f.code === fund.FCODE);
    const shares = configFund ? configFund.shares : 0;
    
    // 基本信息
    const name = fund.SHORTNAME || '--';
    const nav = isNaN(fund.NAV) ? null : fund.NAV;
    const gsz = isNaN(fund.GSZ) ? null : fund.GSZ;
    const gszzl = isNaN(fund.GSZZL) ? 0 : fund.GSZZL;
    const navchgrt = isNaN(fund.NAVCHGRT) ? 0 : fund.NAVCHGRT;
    const pdate = fund.PDATE;
    const gztime = fund.GZTIME;
    
    // 计算收益
    let currentNav = gsz;
    let changeRate = gszzl;
    let gains = 0;
    
    // 判断是否已更新当日净值
    const isUpdated = pdate !== '--' && pdate === gztime.substr(0, 10);
    
    if (isUpdated) {
      currentNav = nav;
      changeRate = navchgrt;
      if (nav && shares > 0) {
        gains = (nav - nav / (1 + changeRate * 0.01)) * shares;
      }
    } else {
      if (gsz && nav && shares > 0) {
        gains = (gsz - nav) * shares;
      }
    }
    
    // 统计
    if (changeRate > 0) upCount++;
    else if (changeRate < 0) downCount++;
    
    if (nav && shares > 0) {
      totalAmount += nav * shares;
    }
    totalGains += gains;
    
    // 涨跌符号
    const symbol = changeRate >= 0 ? '📈' : '📉';
    const updateMark = isUpdated ? '✅' : '';
    
    message += `${symbol} *${name}* ${updateMark}\n`;
    message += `   代码: ${fund.FCODE}\n`;
    message += `   净值: ${formatNumber(nav)} → ${formatNumber(currentNav)}\n`;
    message += `   涨跌: ${changeRate >= 0 ? '+' : ''}${formatNumber(changeRate)}%\n`;
    
    if (shares > 0) {
      message += `   持仓: ${shares}份\n`;
      message += `   收益: ${gains >= 0 ? '+' : ''}${formatAmount(gains)}元\n`;
    }
    
    message += '\n';
  });
  
  // 汇总信息
  message += '━━━━━━━━━━━━━━━\n';
  message += `📊 *汇总统计*\n`;
  message += `   上涨: ${upCount}只 | 下跌: ${downCount}只\n`;
  
  if (totalAmount > 0) {
    const totalRate = (totalGains / totalAmount * 100).toFixed(2);
    message += `   总持仓: ${formatAmount(totalAmount)}元\n`;
    message += `   总收益: ${totalGains >= 0 ? '+' : ''}${formatAmount(totalGains)}元\n`;
    message += `   收益率: ${totalGains >= 0 ? '+' : ''}${totalRate}%\n`;
  }
  
  return message;
}

// 发送Telegram消息
async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
    console.log('Telegram消息发送成功');
    return true;
  } catch (error) {
    console.error('Telegram消息发送失败:', error.message);
    return false;
  }
}

// 主函数: 获取并发送基金报告
async function sendFundReport() {
  console.log('开始生成基金报告...');
  
  // 检查是否为交易日
  if (!isDuringDate()) {
    console.log('今天不是交易日，跳过报告。');
    return;
  }
  
  // 获取所有配置的基金代码
  const fundCodes = config.funds.map(f => f.code);
  
  if (fundCodes.length === 0) {
    console.log('未配置任何基金，请在config.json中添加基金信息。');
    return;
  }
  
  // 获取基金数据
  const fundDataList = await getFundData(fundCodes);
  
  if (fundDataList.length === 0) {
    console.log('未能获取到基金数据');
    return;
  }
  
  // 生成报告消息
  const message = generateFundReport(fundDataList, config.funds);
  
  // 发送到Telegram
  await sendTelegramMessage(message);
}

// 处理命令行参数
const args = process.argv.slice(2);

if (args.includes('--now') || args.includes('-n')) {
  // 立即执行一次
  console.log('立即执行基金报告...');
  sendFundReport().then(() => {
    console.log('执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
} else {
  // 定时任务模式
  console.log('基金Telegram推送服务已启动');
  console.log('定时任务配置:');
  console.log(`  - 早报: ${config.schedule.morningReport} (交易日上午9:00)`);
  console.log(`  - 午报: ${config.schedule.afternoonReport} (交易日下午3:30)`);
  console.log(`监控基金数量: ${config.funds.length}只`);
  console.log('-----------------------------------');
  
  // 设置定时任务 - 早报 (交易日上午9:00)
  if (config.schedule.morningReport) {
    cron.schedule(config.schedule.morningReport, () => {
      console.log('\n[早报] 触发定时任务');
      sendFundReport();
    }, {
      timezone: 'Asia/Shanghai'
    });
  }
  
  // 设置定时任务 - 午报 (交易日下午3:30，收盘后)
  if (config.schedule.afternoonReport) {
    cron.schedule(config.schedule.afternoonReport, () => {
      console.log('\n[午报] 触发定时任务');
      sendFundReport();
    }, {
      timezone: 'Asia/Shanghai'
    });
  }
  
  console.log('\n服务运行中... 按Ctrl+C退出\n');
}
