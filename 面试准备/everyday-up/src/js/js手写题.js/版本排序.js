// ['0.1.1', '2.3.3', '0.302.1', '4.2', '4.3.5', '4.3.4.5']

function compareVersion(arr) {
  arr.sort((version1, version2) => {
    let i = 0;
    let v1 = version1.split(".");
    let v2 = version2.split(".");
    while (true) {
      let charA = v1[i];
      let charB = v2[i];

      i++;

      if (charA === undefined || charB === undefined) {
        // 升序：version1.length - version2.length
        return v2.length - v1.length;
      }

      if (charA === charB) continue;

      // 升序：charA - charB
      return charB - charA;
    }
  });

  return arr;
}

console.log(
  compareVersion(["0.1.1", "2.3.3", "0.302.1", "4.2", "4.3.5", "4.3.4.5"])
);
