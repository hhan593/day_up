n# 16. Go gRPC 与微服务通信

> 来源可信度：**官方结构确认**（基于 grpc.io Go Quick start，2026-05-11 文档）
> 关联：`06-concurrency.md`、`11-context-in-server.md`、`12-project-layout.md`

## 1. 为什么用 gRPC

- 基于 HTTP/2 + Protocol Buffers，强类型、高性能、跨语言。
- 适合**内部服务间**通信（比 JSON/REST 更快、契约更严）。
- 四种方法类型：Unary（一元）、Server streaming、Client streaming、Bidirectional。

## 2. 定义 .proto

```proto
syntax = "proto3";

package greet;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
  rpc SayHelloStream (HelloRequest) returns (stream HelloReply) {} // 服务端流
}

message HelloRequest { string name = 1; }
message HelloReply   { string message = 1; }
```

## 3. 生成代码

```bash
# 装插件
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    greet.proto
```

生成 `greet.pb.go`（消息）+ `greet_grpc.pb.go`（接口/stub）。

## 4. 服务端

```go
type server struct {
    pb.UnimplementedGreeterServer
}

func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
    return &pb.HelloReply{Message: "Hello " + in.GetName()}, nil
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    s := grpc.NewServer()
    pb.RegisterGreeterServer(s, &server{})
    s.Serve(lis)
}
```

## 5. 客户端

```go
func main() {
    conn, _ := grpc.Dial("localhost:50051", grpc.WithInsecure())
    defer conn.Close()
    c := pb.NewGreeterClient(conn)
    r, _ := c.SayHello(context.Background(), &pb.HelloRequest{Name: "Alice"})
    fmt.Println(r.GetMessage())
}
```

## 6. 拦截器（中间件）

```go
func LoggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    log.Printf("method: %s", info.FullMethod)
    return handler(ctx, req)
}
s := grpc.NewServer(grpc.UnaryInterceptor(LoggingInterceptor))
```

- 流式拦截器用 `StreamInterceptor`。
- 与 `12-project-layout.md` 结合：interceptor、服务注册放 `internal/server`。

## 7. 与 context 的关系

gRPC 每个调用都带 `context.Context`，天然支持**超时/取消/元数据传递**（见 `11-context-in-server.md`）。用 `metadata.NewOutgoingContext` 传链路追踪 ID。

## 8. 一句话总结

> gRPC = proto 定义契约 → protoc 生成 stub → 服务端实现接口、客户端调 stub；拦截器做横切，context 做超时与链路传递。Go 微服务内部通信首选。
