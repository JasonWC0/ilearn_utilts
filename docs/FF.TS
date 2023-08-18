// '0933707429', '0989338376', '0908281912', '0983728567', '0981412225', '0963509646', '0905173073', '0982771189', '0966183958', '0975211886', '0956353117', '0909790972', '0903030510', '0912940579',
'0982068552', '0919295277'
enum Direction {
  Up,
  Down,
  Left,
  Right
}

const key: keyof typeof Direction = 'Up';
const direction: Direction = Direction[key];

console.log(direction); // 輸出: 0