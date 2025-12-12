import express from "express";
import {WebSocketServer} from "ws";
import cors from "cors";

const app = express();
app.use(cors());//解决跨域
const server = app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});

//初始化ws服务
const connection ={}
const wss = new WebSocketServer({server});
wss.on("connection", (ws) => {
    //socket只能传递字符串，不能传递对象，所以需要将对象转换为字符串，使用JSON.stringify()方法
    //需要传递的对象{id：1，name："张三"}
    ws.on("message", (message) => {
        const data = JSON.parse(message);
        if(data.action ==='login'){
            if(connection[data.id] && connection[data.id].fingerprint){
                //说明是新设备登录
                connection[data.id].socket.send(JSON.stringify({
                    action: 'logout',
                    message: `您的账号在${new Date().toLocaleDateString()}在另一台设备上登录`,
                }))
            }
            else{
                connection[data.id] = {
                    //第一次登录 将ws对象存储到connection中
                    socket: ws,
                    fingerprint: data.fingerprint,
                }
            }
        }
        console.log(message);
    })
})