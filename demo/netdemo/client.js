import net from 'net';
const client = net.createConnection({
    host: '127.0.0.1',
    port:3000
})
client.on('data',(data)=>{
    console.log(data.toString());
})