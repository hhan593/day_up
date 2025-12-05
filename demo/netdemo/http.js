import net from 'net';
const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body><h1>tacp</h1></body>`

const responseHeaders = [
    'HTTP/1.1 200 OK',
    'Content-Type: text/html',
    'Content-Length: ' + html.length,
    '\r\n',
    html
]

const http = net.createServer(socket=>{
socket.on('data', data=>{
    if(/GET/.test(data.toString())){
        socket.write(responseHeaders.join('\r\n'))
        socket.end()
    }

})
})
http.listen(80,()=>{
    console.log('http server is running at port 80')
})