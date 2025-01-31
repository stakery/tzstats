import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';
import { bakerAccounts } from './config/baker-accounts';
import { proposals } from './config/proposals';
import { TZSTATS_API_URL } from './config';
import _ from 'lodash';

TimeAgo.addLocale(en);
export const timeAgo = new TimeAgo('en-US');

export function isUndefined(x) {
  return typeof x === 'undefined';
}

export function isDefined(x) {
  return typeof x !== 'undefined';
}

export function formatDayTime(ts, fullyear, noweekday) {
  const d = new Date(ts);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  const fmt = !fullyear && isThisYear ? '%b %d - %H:%M:%S' : '%b %d, %Y - %H:%M:%S';
  return timeFormat(noweekday ? fmt : '%a ' + fmt)(d);
}

export function formatDay(ts, fullyear, noweekday) {
  const d = new Date(ts);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  const fmt = !fullyear && isThisYear ? '%b %d' : '%b %d, %Y';
  return timeFormat(noweekday ? fmt : '%a ' + fmt)(d);
}

export function formatTime(ts) {
  return timeFormat('%H:%M')(new Date(ts));
}

export function convertMinutes(num, zero, prefix) {
  if (typeof num === 'string') {
    num = (new Date(num) - new Date()) / 60000;
  } else if (num instanceof Date) {
    num = (num - new Date()) / 60000;
  }
  num = num < 0 ? 0 : num;
  const d = Math.floor(num / 1440);
  const h = Math.floor((num - d * 1440) / 60);
  const m = Math.floor(num % 60);
  let res = [];
  if (d > 0) {
    res.push(d + 'd');
  }
  if (h > 0) {
    res.push(h + (d > 0 && m > 0 ? 1 : 0) + 'h');
  }
  if ((d === 0 && m > 0) || (!zero && d === 0 && h === 0 && m === 0)) {
    res.push(m + 'm');
  }
  if (zero && d === 0 && h === 0 && m === 0) {
    res.push('now');
  } else if (prefix) {
    res.unshift(prefix);
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
  return format(prefix)(value).replace(/(.*)([MkGmµ])$/, '$1 $2');
}

export function formatCurrency(value, prefix = ',', symbol = '') {
  // ꜩ
  // symbol = symbol?' ' + symbol:'';
  if (value === 0) {
    return 0 + symbol;
  }
  return prefix === ','
    ? format(prefix)(value) + symbol
    : (format(prefix)(value) + symbol).replace(/([0-9.]*)(.*)$/, '$1 $2');
}

export function formatCurrencyShort(value, symbol = 'tz') {
  return formatCurrency(value, ',.3s', symbol);
  // return format(',.2s')(value) + ' ' + symbol;
}

export const addCommas = format(',');

export function wrapToBalance(flowData, account) {
  let spendableBalance = account.spendable_balance;
  let today = new Date().setHours(0, 0, 0, 0);
  const day = 1000 * 60 * 60 * 24;
  const length = today - day * 30;
  let timeArray30d = [];
  for (let index = today; index > length; index = index - day) {
    timeArray30d.push(index);
  }
  let res = [];

  timeArray30d.forEach((timeStamp, i) => {
    let item = _.findLast(flowData, item => {
      return new Date(item[0]).setHours(0, 0, 0, 0) === timeStamp;
    });

    if (item) {
      let inFlow = item[1];
      let outFlow = item[2];
      let sum = parseFloat((inFlow - outFlow).toFixed(4));
      spendableBalance = parseFloat((spendableBalance - sum).toFixed());
    }
    res.push({ time: timeStamp, value: spendableBalance });
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

export function wrapStakingData({ balance, deposits, rewards, fees, account, delegation }) {
  let spendableBalance = account.spendable_balance;
  let frozenDeposit = account.frozen_deposits;
  let frozenRewards = account.frozen_rewards;
  let frozenFees = account.frozen_fees;
  let delegationBalance = account.delegated_balance;
  let data = [];
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

    let delegationIn = delegation[i][1];
    let delegationOut = delegation[i][2];

    data.unshift({
      time: balance[i][0],
      total: spendableBalance + frozenDeposit,
      deposit: frozenDeposit,
      balance: spendableBalance,
      reward: frozenRewards + frozenFees,
      delegation: delegationBalance,
    });

    spendableBalance += balanceOut - balanceIn;
    frozenDeposit += depositsOut - depositsIn;
    frozenRewards += rewardsOut - rewardsIn;
    frozenFees += feesOut - feesIn;
    delegationBalance += delegationOut - delegationIn;
  }
  return data;
}

export function fixPercent(settings) {
  let totalPercent = settings.reduce(function(sum, value) {
    return sum + value.percent;
  }, 0);
  settings[0].percent = settings[0].percent + (100 - totalPercent); //Todo fix when 0%

  return settings;
}

export function getShortHash(hash) {
  if (hash === null) {
    return 'none';
  }
  // return hash?`${hash.slice(0, 3)}...${hash.slice(-4)}`:'-';
  return hash ? `${hash.slice(0, 7)}...` : '-';
}

export function getShortHashOrBakerName(hash) {
  if (hash === null) {
    return 'none';
  }
  if (!hash) {
    return '-';
  }
  const baker = bakerAccounts[hash];
  return baker ? baker.name : getShortHash(hash);
}

export function buildTitle(config, page, name) {
  let title = [isMainnet(config) ? 'Tezos ' : 'TESTNET Tezos ' + config.network];
  page && title.push(page);
  name && title.push(name);
  return title.join(' ');
}

export function getHashOrBakerName(hash) {
  if (hash === null) {
    return 'none';
  }
  if (!hash) {
    return '-';
  }
  const baker = bakerAccounts[hash];
  return baker ? baker.name : hash;
}

export function capitalizeFirstLetter(str) {
  return `${str[0].toUpperCase() + str.slice(1)}`;
}

export function getMinutesInterval(start, n, slot = 60) {
  let timeArray = [];
  for (let i = 1; i <= n; i++) {
    timeArray.push(start + slot * 1000 * i);
  }
  return timeArray;
}

export function getPeakVolumeTime(data, hours = 1) {
  const stride = 24 / hours;
  let times = new Array(stride).fill(0);
  data.forEach((v, i) => {
    times[i % stride] += v[1];
  });
  const peak = times.indexOf(Math.max(...times));
  const a = '0' + peak * hours + ':00'; // 00:00 .. 20:00
  const b = '0' + ((peak + 1) % stride) * hours + ':00'; // 00:00 .. 20:00
  return a.substr(a.length - 5) + ' - ' + b.substr(b.length - 5) + ' UTC';
}

export function convertToTitle(str) {
  return str
    .split('_')
    .map(r => capitalizeFirstLetter(r))
    .join(' ');
}

export function getBlockTags(block, config) {
  let tags = [];
  if (block.is_orphan) {
    tags.push('Orphan');
  }
  if (block.is_cycle_snapshot) {
    tags.push('Snapshot');
  } else if (block > 0 && block.height % config.blocks_per_roll_snapshot) {
    tags.push('Snapshot Candidate');
  }
  return tags;
}

export function getOpTags(op) {
  let tags = [];
  // if (op.is_internal) {
  //   tags.push('Internal');
  // }
  // if (op.is_contract) {
  //   tags.push('Contract Call');
  // }
  if (op.params) {
    tags.push('Params');
  }
  if (!op.is_success) {
    tags.push('Failed');
    switch (op.status) {
      case 'backtracked':
        tags.push('Backtracked');
        break;
      case 'skipped':
        tags.push('Skipped');
        break;
      default:
    }
  }
  return tags;
}

export function getAccountTags(account) {
  let tags = [];
  if (account.is_revealed) {
    tags.push('Revealed');
  }
  if (account.is_activated) {
    tags.push('Fundraiser');
  }
  if (account.is_vesting) {
    tags.push('Vesting');
  }
  if (account.address_type === 'blinded') {
    if (!account.is_activated) {
      tags.push('Fundraiser', 'Not Activated');
    } else {
      tags.push('Activated');
    }
  }
  if (!account.is_active_delegate && account.is_delegate && !account.is_delegated) {
    tags.push('Inactive');
  }
  return tags;
}

export function getAccountType(account) {
  if (!account.is_contract && !account.is_delegate && !account.is_delegated) {
    return { name: 'Basic Account', type: 'basic' };
  }
  if (!account.is_contract && !account.is_delegate && account.is_delegated) {
    return { name: 'Delegator Account', type: 'delegator' };
  }
  if (!account.is_contract && account.is_delegate && !account.is_delegated) {
    return { name: 'Baker Account', type: 'baker' };
  }
  if (account.is_contract) {
    return { name: 'Smart Contract', type: 'contract' };
  }
  return { name: 'Basic Account', type: 'basic' };
}

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

export function getEndTime(period, field, noDetail) {
  field = field || 'period_end_time';
  return period.is_open
    ? `ends on ${formatDay(period[field], 1, 1)}` +
        (noDetail ? '' : ` (+${convertMinutes(new Date(period[field]).getTime() / 60000 - Date.now() / 60000)})`)
    : `has ended on ${formatDay(period[field], 1, 1)}`;
}
export function getProposalIdByName(value) {
  const hashes = Object.keys(proposals).filter(key => {
    return proposals[key].name.includes(value);
  });
  return hashes[0] ? proposals[hashes[0]].id : null;
}
export function getProposalByHash(value) {
  const hashes = Object.keys(proposals).filter(key => {
    return key.includes(value);
  });
  return hashes[0] ? proposals[hashes[0]] : null;
}

export function getBakerHashByName(value) {
  value = value.toLowerCase();
  const baker = Object.keys(bakerAccounts).filter(key => {
    return bakerAccounts[key].name.toLowerCase().includes(value);
  });
  return baker[0] || null;
}

export function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function searchBakers(value) {
  let lvalue = value.toLowerCase();
  return Object.keys(bakerAccounts)
    .filter(key => {
      return key.includes(value) || bakerAccounts[key].name.toLowerCase().includes(lvalue);
    })
    .reduce((acc, key) => {
      let c = bakerAccounts[key];
      c.key = key;
      acc.push(c);
      return acc;
    }, [])
    .sort((a, b) => a.name - b.name);
}

export function searchProposals(value) {
  let lvalue = value.toLowerCase();
  return Object.keys(proposals)
    .filter(key => {
      return key.includes(value) || proposals[key].name.toLowerCase().includes(lvalue);
    })
    .reduce((acc, key) => {
      let c = proposals[key];
      c.key = key;
      acc.push(c);
      return acc;
    }, [])
    .sort((a, b) => a.name - b.name);
}

export function getSlots(value) {
  if (!value) {
    return [...new Array(32).fill(0)];
  }
  const bits = value
    .toString(2)
    .split('')
    .map(b => parseInt(b));
  const zeroBits = 32 - bits.length;
  return [...new Array(zeroBits).fill(0), ...bits];
}

export function isCycleStart(height, config) {
  return height > 0 && (height - 1) % config.blocks_per_cycle === 0;
}

export function isCycleEnd(height, config) {
  return height > 0 && height % config.blocks_per_cycle === 0;
}

export function cycleFromHeight(height, config) {
  return !height ? 0 : (height - 1) / config.blocks_per_cycle;
}

export function cycleStartHeight(cycle, config) {
  return cycle * config.blocks_per_cycle + 1;
}

export function cycleEndHeight(cycle, config) {
  return (cycle + 1) * config.blocks_per_cycle;
}

export function snapshotBlock(cycle, index, config) {
  // no snapshot before cycle 7
  return cycle < 7 ? 0 : cycleStartHeight(cycle - 7, config) + (index + 1) * config.blocks_per_roll_snapshot - 1;
}

const hashTypeMap = {
  tz1: { type: 'account', b58len: 36, shortMatch: true },
  tz2: { type: 'account', b58len: 36, shortMatch: true },
  tz3: { type: 'account', b58len: 36, shortMatch: true },
  KT1: { type: 'account', b58len: 36, shortMatch: true },
  btz1: { type: 'account', b58len: 37, shortMatch: true },
  B: { type: 'block', b58len: 51, shortMatch: true },
  o: { type: 'operation', b58len: 51, shortMatch: true },
  P: { type: 'protocol', b58len: 51, shortMatch: true },
};

export function getHashType(hash, strictMatch) {
  const match = Object.keys(hashTypeMap).filter(k => {
    return (
      hash.startsWith(k) &&
      (hash.length === hashTypeMap[k].b58len ||
        (!strictMatch && hashTypeMap[k].shortMatch && hash.length < hashTypeMap[k].b58len))
    );
  });
  return match.length ? hashTypeMap[match[0]].type : null;
}

// works with /explorer/config and /explorer/chain objects
export function isMainnet(o) {
  return o && o.chain_id === 'NetXdQprcVkpaWU' && TZSTATS_API_URL === 'https://api.tzstats.com';
}
