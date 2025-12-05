import net from 'net';
const server = net.createServer(socker =>{
    setInterval(()=>{
        socker.write('hello');
    },1000);

})
server.listen(3000,()=>{
    console.log('server is running at port 3000');
})