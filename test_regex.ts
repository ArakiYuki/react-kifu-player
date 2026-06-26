const regex = /\*?解析(?:.*?候補(\d+))?.*?評価値\s+(-?)(詰)?\s*(-?\d+).*?読み筋\s+(.*)/;
const line1 = '*解析 0  候補1 時間 00:10.0 深さ 34 ノード数 178144 評価値 3 読み筋 △同　歩(85) ▲同　飛(88)';
const line2 = '*解析 0 △ 評価値 -詰 3 読み筋 △同　角成(46)';
console.log(line1.match(regex));
console.log(line2.match(regex));
