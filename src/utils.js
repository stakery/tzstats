import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { format } from 'd3-format';
import { bakerAccounts } from './config/baker-accounts';
import { proposals } from './config/proposals';
import _ from 'lodash';

TimeAgo.addLocale(en);
export const timeAgo = new TimeAgo('en-US');

export function convertMinutes(num) {
  const d = Math.floor(num / 1440);
  const h = Math.floor((num - d * 1440) / 60);
  const m = Math.floor(num % 60);
  let res = [];

  if (d > 0) {
    res.push(d + 'd');
  }
  if (h > 0) {
    res.push(h + 'h');
  }
  if (m > 0) {
    res.push(m + 'm');
  }
  return res.join(' ');
}

export function isValid(...args) {
  let res = args.map(item => {
    if (!item) return false;
    if (Array.isArray(item) && !item.length) return false;
    return true;
  });
  return !res.includes(false);
}

export function formatValue(value, prefix = ',') {
  value = value || 0;
  return format(prefix)(value)
    .replace('M', ' M')
    .replace('k', ' k')
    .replace('G', ' G');
}
export function formatCurrency(value, prefix = ',', symbol = 'ꜩ') {
  if (value === 0) {
    return 0 + ' ꜩ';
  }
  if (value > 1 && value < 1000) {
    return value + ' ꜩ';
  }
  return prefix === ','
    ? `${format(prefix)(value)} ${symbol}`
    : format(prefix)(value)
        .replace('M', ' M' + symbol)
        .replace('k', ' k' + symbol)
        .replace('G', ' G' + symbol)
        .replace('m', ' m' + symbol)
        .replace('µ', ' µ' + symbol);
}

export function formatCurrencyShort(value) {
  return formatCurrency(value, '.2s');
}

export const addCommas = format(',');

export function wrapFlowData(flowData, account) {
  let inFlowData = { id: 'In-flow', color: '#1af3f9', data: [] };
  let outFlowData = { id: 'Out-flow', color: '#83899B', data: [] };

  let balance = account.spendable_balance;
  let dataInOut = [];

  //[0]-time [1]-in [2]-out

  flowData.reverse().map(item => {
    let time = item[0];
    let inFlow = item[1];
    let outFlow = item[2];
    inFlowData.data.unshift({ x: time, y: inFlow });
    outFlowData.data.unshift({ x: time, y: -outFlow });
    dataInOut.unshift({ time: time, inFlow: inFlow, outFlow: -outFlow, balance: balance });
    balance += outFlow - inFlow;
  });
  return { inFlowData, outFlowData, dataInOut };
}

//todo reafactoring
export function wrapToBalance(flowData, account) {
  let spandableBalance = account.spendable_balance;
  let today = new Date().setHours(0, 0, 0, 0);
  const day = 1000 * 60 * 60 * 24;
  const length = today - day * 30;
  let timeArray30d = [];
  for (let index = today; index > length; index = index - day) {
    timeArray30d.push(index);
  }
  let res = [];

  timeArray30d.map((timeStamp, i) => {
    let item = _.findLast(flowData, item => {
      return new Date(item[0]).setHours(0, 0, 0, 0) === timeStamp;
    });

    if (item) {
      let inFlow = item[1];
      let outFlow = item[2];
      let sum = parseFloat((inFlow - outFlow).toFixed(4));
      spandableBalance = parseFloat((spandableBalance - sum).toFixed());
    }
    res.push({ time: timeStamp, value: spandableBalance });
  });
  return res.reverse();
}

export function wrapToVolume(volSeries) {
  let chunkedArray = _.chunk(volSeries, 6);
  let volume = chunkedArray.reduce((prev, current, i) => {
    prev[i] = current;
    return prev;
  }, {});
  return volume;
}

export function wrapStakingData({ balance, deposits, rewards, fees, account }) {
  let stakingBond = { id: 'Staking Bond', color: '#1af3f9', data: [] };
  let currentDeposit = { id: 'Current Deposit', color: '#83899B', data: [] };
  let pendingRewards = { id: 'Pending Rewards', color: '#83899B', data: [] };
  let spendableBalance = account.spendable_balance;
  let frozenDeposit = account.frozen_deposits;
  let frozenRewards = account.frozen_rewards;
  let frozenFees = account.frozen_fees;
  let allData = [];
  //[0]-time [1]-in [2]-out
  for (let i = balance.length - 1; i >= 0; i--) {
    let balanceIn = balance[i][1];
    let balanceOut = balance[i][2];

    let depositsIn = deposits[i][1];
    let depositsOut = deposits[i][2];

    let rewardsIn = rewards[i][1];
    let rewardsOut = rewards[i][2];

    let feesIn = fees[i][1];
    let feesOut = fees[i][2];

    //spandable_balance + frozen depozit
    stakingBond.data.unshift({ x: balance[i][0], y: spendableBalance + frozenDeposit });
    //frozen depozit
    currentDeposit.data.unshift({ x: balance[i][0], y: frozenDeposit });
    //frozen rewards + frozen fees
    pendingRewards.data.unshift({ x: balance[i][0], y: frozenRewards + frozenFees });

    allData.unshift({
      time: balance[i][0],
      bond: spendableBalance + frozenDeposit,
      deposit: frozenDeposit,
      rewards: frozenRewards + frozenFees,
    });

    spendableBalance += balanceOut - balanceIn;
    frozenDeposit += depositsOut - depositsIn;
    frozenRewards += rewardsOut - rewardsIn;
    frozenFees += feesOut - feesIn;
  }
  return { stakingBond, currentDeposit, pendingRewards };
}

//Todo replace it with clean function
export function fixPercent(settings) {
  let totalPercent = settings.reduce(function(sum, value) {
    return sum + value.percent;
  }, 0);
  settings[0].percent = settings[0].percent + (100 - totalPercent); //Todo fix when 0%

  return settings;
}

export function getShortHash(hash) {
  return `${hash.slice(0, 3)}...${hash.slice(-4)}`;
}
export function getShortHashOrBakerName(hash) {
  const names = Object.keys(bakerAccounts).filter(key => {
    return bakerAccounts[key].toLowerCase().includes(hash.toLowerCase());
  });
  return names[0] ? names[0] : getShortHash(hash);
}

export function capitalizeFirstLetter(str) {
  return `${str[0].toUpperCase() + str.slice(1)}`;
}

export function getMinutesInterval(lastTime, minutes) {
  let timeArray = [];
  const length = lastTime - 60000 * minutes;
  for (let index = lastTime; index > length; index = index - 60000) {
    timeArray.push(index);
  }
  return timeArray;
}

export function wrappBlockDataToObj(array) {
  let filtered = array.filter((item, index) => {
    if (index !== 0 && array[index - 1][2] != item[2]) {
    }
  });
  return array.reduce((obj, item, index) => {
    if (index !== 0 && array[index - 1][2] != item[2]) {
      obj[new Date(item[0]).setSeconds(0, 0)] = {
        time: new Date(item[0]).setSeconds(0, 0),
        hash: item[1],
        height: item[2],
        priority: item[3],
        opacity: item[3] === 0 ? 1 : item[3] < 8 ? 0.8 : item[3] < 16 ? 0.6 : item[3] < 32 ? 0.4 : 0.2,
        is_uncle: item[4] || false,
      };
    }
    return obj;
  }, {});
}

export function getDelegatorByHash(hash) {
  return Object.keys(bakerAccounts).filter(r => bakerAccounts[r] === hash);
}

export function getPeakVolumeTime(data, hours = 1) {
  const stride = 24 / hours;
  let times = new Array(stride).fill(0);
  data.map((v, i) => {
    times[i % stride] += v[1];
  });
  const peak = times.indexOf(Math.max(...times));
  const a = '0' + peak * hours + ':00'; // 00:00 .. 20:00
  const b = '0' + ((peak + 1) % stride) * hours + ':00'; // 00:00 .. 20:00
  return a.substr(a.length - 5) + ' - ' + b.substr(b.length - 5) + ' UTC';
}

export function getDailyVolume(data) {
  return _.sumBy(data, o => o.vol_base) / data.length;
}

export function convertToTitle(str) {
  return str
    .split('_')
    .map(r => capitalizeFirstLetter(r))
    .join(' ');
}
export function getSearchType(searchValue) {
  return searchValue[0] === 'o'
    ? 'operation'
    : searchValue[0] === 'B' || parseInt(searchValue)
    ? 'block'
    : searchValue[0] === 'P'
    ? 'election'
    : 'account';
}

export function getAccountTags(account) {
  let tags = [];
  if (account.is_revealed) {
    tags.push('Revealed');
  }
  if (account.is_) {
    tags.push('Revealed');
  }
  if (account.is_) {
    tags.push('Revealed');
  }
  if (account.is_) {
    tags.push('Revealed');
  }
}

export function getAccountType(account) {}

export function getNetworkHealthStatus(value) {
  return value <= 16.6
    ? { name: 'Catastrophic', value: 1 }
    : value <= 33.3
    ? { name: 'Very Bad', value: 2 }
    : value <= 50
    ? { name: 'Bad', value: 3 }
    : value <= 66.6
    ? { name: 'Fair', value: 4 }
    : value <= 83.3
    ? { name: 'Good', value: 5 }
    : value < 100
    ? { name: 'Very Good', value: 6 }
    : { name: 'Excellent', value: 6 };
}

export function getEndTime(period) {
  return period.is_open
    ? `ends in ${convertMinutes((new Date(period.period_end_time) - Date.now()) / 60000)}`
    : 'has ended';
}
export function getProposalIdByName(value) {
  const hashes = Object.keys(proposals).filter(key => {
    return proposals[key].name.includes(value);
  });
  return hashes[0] ? proposals[hashes[0]].id : null;
}

export function getBakerHashByName(value) {
  const names = Object.keys(bakerAccounts).filter(key => {
    return key.toLowerCase().includes(value.toLowerCase());
  });
  return names[0] ? bakerAccounts[names[0]] : null;
}
export function findBakerName(value) {
  const names = Object.keys(bakerAccounts).filter(key => {
    return key.toLowerCase().includes(value.toLowerCase());
  });
  return names[0];
}
export function getProposalName(value) {
  const hashes = Object.keys(proposals).filter(key => {
    return proposals[key].name.toLowerCase().includes(value.toLowerCase());
  });
  return hashes[0] ? proposals[hashes[0]].name : null;
}

export function getSlots(value) {
  if (!value) {
    return [...new Array(32).fill('0')];
  }
  const bits = value.toString(2);
  const zeroBits = 32 - bits.length;
  return [...new Array(zeroBits).fill('0'), ...bits];
}
