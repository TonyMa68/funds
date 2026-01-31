const axios = require('axios');

// 生成设备ID (与原项目保持一致)
function getGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const deviceId = getGuid();

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

// 模拟基金数据（用于测试）
const mockFundData = [
  {
    FCODE: '001186',
    SHORTNAME: '富国文体健康',
    NAV: 1.5230,
    GSZ: 1.5380,
    GSZZL: 0.98,
    NAVCHGRT: 0,
    PDATE: '2024-01-30',
    GZTIME: '2024-01-31 14:55'
  },
  {
    FCODE: '110022',
    SHORTNAME: '易方达消费行业',
    NAV: 3.2150,
    GSZ: 3.1890,
    GSZZL: -0.81,
    NAVCHGRT: 0,
    PDATE: '2024-01-30',
    GZTIME: '2024-01-31 14:55'
  }
];

// 配置的基金信息
const configFunds = [
  {
    code: '001186',
    name: '富国文体健康',
    shares: 1000
  },
  {
    code: '110022',
    name: '易方达消费行业',
    shares: 500
  }
];

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

// 测试生成报告
console.log('测试基金报告生成功能...\n');
console.log('使用模拟数据:');
console.log(JSON.stringify(mockFundData, null, 2));
console.log('\n生成的Telegram消息:\n');
console.log('─'.repeat(50));
const message = generateFundReport(mockFundData, configFunds);
console.log(message);
console.log('─'.repeat(50));
console.log('\n✅ 消息生成成功！');
console.log('\n说明：');
console.log('- 📈 表示上涨，📉 表示下跌');
console.log('- ✅ 表示当日净值已更新');
console.log('- 无✅ 表示使用实时估值');
console.log('\n在实际运行时，此消息将通过Telegram Bot API发送到指定的Chat ID。');
