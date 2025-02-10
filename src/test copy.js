var trap = function (height) {
  let total = 0;
  let left = 0;
  let right = height.length - 1;
  //  for (let i = 0; i < height.length; i++) {}
  let leftMax = 0;
  let rightMax = 0;

  const diff = height.map((h, i) => {
    if (i < height.length - 1) {
      return height[i + 1] - h;
    }
    return 0;
  });

  for (let i = 0; i < diff.length; i++) {
    if (diff[i] > 0) {
      total += diff[i];
    }
  }
  //  while (left < right) {
  //    if (height[left] < height[right]) {
  //      if (height[left] >= leftMax) {
  //        leftMax = height[left];
  //      } else {
  //        total += leftMax - height[left];
  //      }
  //      left++;
  //    } else {
  //      if (height[right] >= rightMax) {
  //        rightMax = height[right];
  //      } else {
  //        total += rightMax - height[right];
  //      }
  //      right--;
  //    }
  //  }
  console.log(total);
  return total;
};

trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]); // 6
