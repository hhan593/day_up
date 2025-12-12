// 1. try   catch
// try{
//     throw new Error("这里出错了！");
// }catch(e){
//     console.log(e)
// }

// 2. callback.
// var fs = require("fs");
// fs.readFile("./a.json",'utf8', function(error, result) {
//   if (error) {
//     console.log(error);
//     return;
//   }
//   console.log(JSON.parse(result));
// });


// 3. promise（不能捕获异步）



// process(可以捕获异步)
process.on('uncaughtException', (e) => {
  console.log(e);
  console.log('我能进来，说明可以处理异常');
  
});

function testFunc() {
  throw new Error('error');
}

testFunc();



// 2. 多进程模式加异常捕获后重启
// const cluster = require('cluster');	
// const os = require('os');	
// const http = require('http');
// const domain = require('domain');

// const d = domain.create();	
	
// if (cluster.isMaster) {	
//   const cpuNum = os.cpus().length;	
//   for (let i = 0; i < cpuNum; ++i) {	
//     cluster.fork()	
//   };	
//   // fork work log	
//   cluster.on('fork', worker=>{	
//     console.info(`${new Date()} worker${worker.process.pid}进程启动成功`);	
//   });	
//   // 监听异常退出进程，并重新fork	
//   cluster.on('exit',(worker,code,signal)=>{	
//     console.info(`${new Date()} worker${worker.process.pid}进程启动异常退出`);	
//     cluster.fork();	
//   })	
// } else {	
//   http.createServer((req, res)=>{	
//     d.add(res);	
//     d.on('error', (err) => {	
//       console.log('记录的err信息', err.message);	
//       console.log('出错的 work id:', process.pid);	
//       // uploadError(err)  // 上报错误信息至监控	
//       res.end('服务器异常, 请稍后再试');	
//       // 将异常子进程杀死	
//       cluster.worker.kill(process.pid);	
//     });	
//     d.run(handle.bind(null, req, res));	
//   }).listen(8080);	
// }	
	
// function handle(req, res) {	
//   if (process.pid % 2 === 0) {	
//     throw new Error(`出错了`);	
//   }	
//   res.end(`response by worker: ${process.pid}`);	
// };