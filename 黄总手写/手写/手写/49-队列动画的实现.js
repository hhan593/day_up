function InitQueue(){
    this.dataStore = [];
    this.add = this.add;
    this.del = this.del;
    this.first = first;
    this.end = end;
    this.displayData = displayData;  // 显示队列中所有数据
    this.empty = empty;  // 判断队列是否为空；
}


function add(val){
    this.displayData.push()
}


function del(){
    return this.dataStore.shift();
}

function first(){
    return this.dataStore[0];
}

function end(){
    return this.dataStore[this.dataStore.length - 1];
}

function empty(){
    if(this.dataStore.length = 0){
        return true;
    }else{
        return false;
    }
}

function empty(){
    if(this.dataStore.length == 0){
        return true
    }else{
        return false
    }
}


let q = new InitQueue();
q.add('data1');
q.add