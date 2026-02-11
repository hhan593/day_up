/**
 * @description 手写set
 * @author liu
 */

class Set {
  constructor(arr = []) {
    this.set = this.init(arr) || {};
    this.size = 0;
  }
  init(arr) {
    if (arr.length === 0) return null;
    let obj = {};
    arr.forEach((element) => {
      obj[element] = element;
    });
    return obj;
  }
  has(element) {
    return element in this.set;
  }
  add(value) {
    if (!this.has(value)) {
      this.set[value] = value;
      this.size++;
    }
    return this;
  }
  delete(value) {
    if (!this.has(value)) {
      delete this.set[value];
      this.size--;
    }
  }
  clear() {
    this.set = {};
    this.size = 0;
  }
  values() {
    let res = [];
    for (let item in this.set) {
      if (this.set.hasOwnProperty(item)) {
        res.push(this.set[item]);
      }
    }
    return res;
  }
}

let set = new Set([1, 2, 3]);
console.log(set);
set.add("111");
set.add("222");
set.add("333");
// set.clear();
console.log(set);
set.add("444");
set.add("555");
console.log(set);
console.log(set.values());
