### 2、实现 Set：
```js
class Set {
  constructor() {
    this.items = {};
    this.size = 0;
  }

  has(element) {
    return element in this.items;
  }

  add(element) {
    if(!this.has(element)) {
      this.items[element] = element;
      this.size++;
    }
    return this;
  }

  delete(element) {
    if (this.has(element)) {
      delete this.items[element];
      this.size--;
    }
    return this;
  }

  clear() {
    this.items = {}
    this.size = 0;
  }
  keys(){
    let keys = [];
    for(let key in this.items){
      if(this.items.hasOwnProperty(key)){
        keys.push(key)
      }
    }
    return keys;
  }

  values() {
    let values = [];
    for(let key in this.items) {
      if(this.items.hasOwnProperty(key)) {
        values.push(this.items[key]);
      }
    }
    return values;
  }
  entries(){
    let entries = [];
    for(let key in this.items){
      if(this.items.hasOwnProperty(key)){
        entries.push([key,this.items[key]])
      }
    }
    return entries;
  }
  
}
```