// token校验
// module.exports = (options) => async (ctx, next) {
//   try {
//     // 获取 token
//     const token = ctx.header.authorization
//     if (token) {
//       try {
//           // verify 函数验证 token，并获取用户相关信息
//           await verify(token)
//       } catch (err) {
//         console.log(err)
//       }
//     }
//     // 进入下一个中间件
//     await next()
//   } catch (err) {
//     console.log(err)
//   }
// }




// 日志模块
// const fs = require('fs')
// module.exports = (options) => async (ctx, next) => {
//   const startTime = Date.now()
//   const requestTime = new Date()
//   await next()
//   const ms = Date.now() - startTime;
//   let logout = `${ctx.request.ip} -- ${requestTime} -- ${ctx.method} -- ${ctx.url} -- ${ms}ms`;
//   // 输出日志文件
//   fs.appendFileSync('./log.txt', logout + '\n')
// }




