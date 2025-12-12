// function Queue() {

//     this.items = []

//     this.add = element => {
//         this.items.push(element)
//     }

//     this.del = () => {
//         return this.items.shift()
//     }
//     this.top = () => {
//         return this.items[0]
//     }
//     this.isEmpty = () => {
//         return this.items.length == 0;
//     }
//     this.size = () => {
//         return this.items.length
//     }

//     this.toString = () => {
//         let resultString = ''
//         for (let i of this.items){
//             resultString += i + ' '
//         }
//         return resultString
//     }
// }


// let queue = new Queue();
// queue.add(1)
// queue.add(2)
// queue.add(3)
// queue.add(4)
// queue.del()
// queue.add(4)
// queue.add(4)
// console.log(queue.items)






function LinkedQueue () {
        //节点结构定义
	var Node = function(element){
		this.element = element;
		this.next = null;
	} 

	var length = 0,
		front,//队首指针
		rear;//队尾指针
        //入队操作
	this.push = function(element){
		var node = new Node(element),
			current;

		if(length == 0){
			front = node;
			rear = node;
			length++;

			return true;
		}else{
			current = rear;
			current.next = node;
			rear = node;
			length++;

			return true;
		}
	}
        //出队操作
	this.pop = function(){
		if(!front){
			return 'Queue is null';
		}else{
			var current = front;
			front = current.next;
			current.next = null;
			length--;
			return current;
		}
	}
        //获取队长
	this.size = function(){
		return length;
	}
        //获取队首
	this.getFront = function(){
		return front;
	}
        //获取队尾
	this.getRear = function(){
		return rear;
	}
      
	this.toString = function(){
		var str = '',
			current = front;

		while(current){
			str += current.element;
			current = current.next;
		}

		return str;
	}
        //清除队列
	this.clear = function(){
		front = null;
		rear = null;
		length = 0;
		return true;
	}
}


function ArrayQueue(){
	var arr = [];
        //入队操作
	this.push = function(element){
		arr.push(element);
		return true;
	}
        //出队操作
	this.pop = function(){
		return arr.shift();
	}
        //获取队首
	this.getFront = function(){
		return arr[0];
	}
        //获取队尾
	this.getRear = function(){
		return arr[arr.length - 1]
	}
        //清空队列
	this.clear = function(){
		arr = [];
	}
        //获取队长
	this.size = function(){
		return length;
	}
}







