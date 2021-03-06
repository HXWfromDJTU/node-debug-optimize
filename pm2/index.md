## net模块
### net.Server
* 事件类型
    1. close
    2. connection
    3. error
    4. listening

### 建立socket
1. Socket 函数需要指定到底是 IPv4 还是 IPv6
2. 还要指定到底是 TCP 还是 UDP

### TCP Socket
#### 建连过程
1. TCP 的服务端要先监听一个端口，一般是先调用 bind 函数，给这个 Socket 赋予一个 IP 地址和端口
2. 当一个网络包来的时候，内核要通过 TCP 头里面的这个端口，来找到你这个应用程序
3. 当服务端有了 IP 和端口号，就可以调用 listen 函数进行监听。当调用 listen 函数之后，服务端就进入 listen 状态
4. 内核为每个 Socket 维护两个队列，一个是 已经完成三次握手，处理 established 状态的队列，另一个是 握手还没有完成的队列，处于 syn_rcvd 状态。   
5. 服务端程序调用 accept 函数，取出一个已经完成的连接进行处理。     
    * TCP Socket 就是一个文件流，因为 socket 在 Linux 中华就是以文件的形式存在的。
    * 除此之外，文件的写入和读出都是通过文件描述符

### UDP Socket
1. 对于 UDP 来讲，过程有些不一样。UDP 是没有连接的，所以不需要三次握手，也就不需要调用 listen 和 connect
2. UDP 的交互仍然需要 IP 和端口号，因而也需要 bind
3. 只要有一个 Socket，就能够和多个客户端通信     
4. 每次通信的时候，都调用 sendto 和 recvfrom，都可以传入 IP 地址和端口

## 主从模式
* 主进程不负责具体业务的处理，而负责调度或管理工作进程，取向与稳定
* 工作进程负责具体的业务处理，因为业务的多样性、甚至需要多人完成，所以稳定性更需要关注

### IPC
* 让不同破名的进程能够相互访问资源，并进行协调工作
* 实现技术: 命名管道、匿名管道、socket、信号量、共享内存、消息队列、Domain Socket等等
* Node中使用 libuv 的管道技术进行实现
* IPC连接过程: 
    1. 父进程准备创建子进程前，先创建一个IPC通道
    2. 再实际创建子进程
    3. 通过全局变量`NODE_CHANNEL_FD`告诉子进程这个IPC的文件描述符
    4. 子进程在启动过程中，主动去连接这个IPC
* IPC 实现的是双向通信，因为其底层的实现机制为 `Domain Socket`，所以与网络中的`socket`表现类似。

## 主从模式
#### ① 使用 代理模式 实现 主从架构
1. 主进程监听80端口，子进程监听其他不同的端口，可以实现基本的组主从架构
2. 但客户端到主进程，主进程到子进程，都分别要占用一个文件描述符。是理想情况的双倍。
#### ② 解决代理模式的问题
1. 父进程接收到socket请求之后，将socket发送给工作进程，而不是与工作进程之间建立新的socket连接来转发数据
2. socket发送给子进程后，父进程对应的服务器也会关闭
3. Node 进程间通信，实际上只能够发送消息，不能够传递对象
4. 能够实现tcp服务器的传递，其实只是子进程根据父进程发送来的消息类型，重新创建的Tcp服务器而已   

#### ③ 共同监听端口问题
1. Node 底层对每个监听端口设置了 `SO_REUSEADDR` 选项，使得不同进程可以就相同的网卡和端口进行监听
2. 对于主进程通过 send 语句发送给子进程的的句柄，子进程还原出来的 tcp 服务器的文件描述符是一致的，所以监听相同的端口，不会引起异常
3. 多个进程监听相同的端口时，文件描述符同一个时间只能够被某个进程所使用。
4. 也就是说，面对网络请求，只有一个幸运的进程能够抢占连接进行服务(抢占式的) 


### 主从工作机制总结
1. 所有请求先统一经过内部TCP服务器，真正监听端口的只有主进程
2. 在内部TCP服务器处理请求的逻辑中，有负载均衡地挑选出一个worker进程，向其发送`newconn`的内部消息，并附带客户端句柄
3. Worker 进程接收到此内部消息，根据客户端句柄使用 `net.Socket` 创建实例，执行距离业务逻辑，并且返回    

### Socket 连接上来看主从模式
1. 主进程相当于是一个代理，在那里监听来的请求。一旦建立了一个连接，就会有一个已连接 Socket
2. 主进程通过 fork 函数创建一个子进程，复制的内容包括
    * 文件描述符的列表
    * 内存空间
    * 当前程序进程记录到了哪一行代码
3. 进程复制完成之后，子进程通过 UNIQUE_ID 来判断自己是父进程还是子进程
4. 因为复制了文件描述符列表，父进程刚才所达成连接的 Socket 也自然在其中

    
### cluster 对 child_process的封装
#### 进程中使用`NODE_UNIQUE_ID`进行判断是否处于`master`进程
```js
 cluster.isWorker = ('NODE_UNIQUE_ID' in process.env)
 cluster.isMaster = (cluster.isWorker === false)
 ```
#### 实现步骤
1. cluster模块就是child_process和net模块的组合应用
2. 当cluster启动时，他会在内部启动TCP服务器，在 cluster.fork() 时，将TCP服务器的socket文件描述符传递给工作进程
3. 工作进程是被 cluster.fork() 出来的，所以会存在 `NODE_UNIQUE_ID`
4. 工作进程中若进行 listen 监听网络端口，它将拿到该文件描述符，通过设置 `SO_REUSEADDR` 为1，实现多个子进程共享端口


### 主从模式的其他问题
#### 实现平滑重启
1. 子进程需要监听 `uncaughtException` 事件，事件发生时利用IPC 通知父进程自己准备退出了     
2. 父进程收到到子进程`SUICIDE`消息后，马上创建新的`worker`进程，进行补位
3. 发出 `SUICIDE` 消息后，子进程服务器关闭(停止接收新连接)，所有已有的连接断开之后，使用`process.exit(1)`进行退出  
4. 在子进程推出前，还需要进行日志的输出
5. 为了保证资源的及时释放，服务器关闭设置一个超时时间，超过时长则强制进行进程退出。

#### 负载均衡
1. window 上使用句柄共享
2. (*nix) 上使用 round-robin

#### 状态共享
1. 使用第三方存储
2. 抽离单独的通知进程，让它单独与Redis等第三方存储状态更新获取
3. 类似于 Egg.js 中的 `agent` 进程   


## PM2
PM2 模块是 cluster 模块的一个包装层，尽量将 cluster 模块抽象封装，让用户像是使用单进程一样部署多进程 Node 应用  

### PM2 的功能
   1. 风脏 Node cluster 模块，内部自建负载均衡
   2. 支持后台运行
   3. 0 秒停机重载，代码更新时，不需要停机
   4. 具有频繁重启的检测，避免无限循环重启
### PM2 常见模块
   1. Satan.js 提供了程序的退出、杀死等方法
   2. God.js 提供了负责维护进程的正常运行，当有异常的时候能够重启。相当于主从模式中的 master 进程。

## todo
* SO_REUSEADDR 与 TIME_WAIT

## 参考资料
1. [Websocket原理及具体使用](https://juejin.cn/post/6857716625764777991#heading-46)   
2. [Net 网络模块 - Node.js技术栈](https://www.bookstack.cn/read/Nodejs-Roadmap/nodejs-net.md)      
3. [趣谈网络协议]() 
4. [TCP协议中的端口具体指的是什么 - 知乎](https://www.zhihu.com/question/22577025/answer/125711899)    