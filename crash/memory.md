### node内存管理与释放

首先让我们来尝试一个小实验,执行一下代码会发生什么呢？
```js
let arr = [];
while(true)
  arr.push(1);
```

本 markdown 支持在线运行 nodejs 🙃🙃🙃，结果如下
```bash
<--- Last few GCs --->

[80431:0x102808000]     1658 ms: Mark-sweep 577.3 (584.5) -> 577.3 (581.5) MB, 65.5 / 0.0 ms  (average mu = 0.414, current mu = 0.000) last resort GC in old space requested
[80431:0x102808000]     1718 ms: Mark-sweep 577.3 (581.5) -> 577.3 (581.5) MB, 59.1 / 0.0 ms  (average mu = 0.287, current mu = 0.001) last resort GC in old space requested


<--- JS stacktrace --->

==== JS stack trace =========================================

    0: ExitFrame [pc: 0x1186275be3d]
Security context: 0x3df58899e6e9 <JSObject>
    1: /* anonymous */ [0x3df50bf8aed1] [/Users/swainwong/Desktop/workspace/node-debug-optimize/crash/crash-test.js:~1] [pc=0x118627eb90a](this=0x3df50bf8b001 <Object map = 0x3df5eb502571>,exports=0x3df50bf8b001 <Object map = 0x3df5eb502571>,require=0x3df50bf8afc1 <JSFunction require (sfi = 0x3df53e2ad911)>,module=0x3df50bf8af39 <Module map = 0x3df5eb554dc9>,...

FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
 1: 0x10003d035 node::Abort() [/usr/local/bin/node]
 2: 0x10003d23f node::OnFatalError(char const*, char const*) [/usr/local/bin/node]
 3: 0x1001b8e15 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [/usr/local/bin/node]
 4: 0x100586d72 v8::internal::Heap::FatalProcessOutOfMemory(char const*) [/usr/local/bin/node]
 5: 0x100590274 v8::internal::Heap::AllocateRawWithRetryOrFail(int, v8::internal::AllocationSpace, v8::internal::AllocationAlignment) [/usr/local/bin/node]
 6: 0x10055f576 v8::internal::Factory::NewFixedArrayWithFiller(v8::internal::Heap::RootListIndex, int, v8::internal::Object*, v8::internal::PretenureFlag) [/usr/local/bin/node]
 7: 0x1004fe1de v8::internal::(anonymous namespace)::ElementsAccessorBase<v8::internal::(anonymous namespace)::FastPackedSmiElementsAccessor, v8::internal::(anonymous namespace)::ElementsKindTraits<(v8::internal::ElementsKind)0> >::GrowCapacity(v8::internal::Handle<v8::internal::JSObject>, unsigned int) [/usr/local/bin/node]
 8: 0x1007a1daf v8::internal::Runtime_GrowArrayElements(int, v8::internal::Object**, v8::internal::Isolate*) [/usr/local/bin/node]
 9: 0x1186275be3d 
10: 0x118627eb90a 
11: 0x118627118d5 
12: 0x118627118d5 
13: 0x118627118d5 
14: 0x118627118d5 
[1]    80431 abort      node crash/crash-test.js
```
头皮发麻获得了一个这个样的错误日志......不着急，我们慢慢来解读下

#### GC
映入眼帘的第一个部分就是最近的 GC 信息
```bash 
<--- Last few GCs --->

[80431:0x102808000]     1658 ms: Mark-sweep 577.3 (584.5) -> 577.3 (581.5) MB, 65.5 / 0.0 ms  (average mu = 0.414, current mu = 0.000) last resort GC in old space requested
[80431:0x102808000]     1718 ms: Mark-sweep 577.3 (581.5) -> 577.3 (581.5) MB, 59.1 / 0.0 ms  (average mu = 0.287, current mu = 0.001) last resort GC in old space requested
```
看过朴灵老师的《深入浅出 Nodejs》的小伙伴都能知道，node的GC是区分为新生代、和老生代两部分的。
![](../assets/node-gc.png)

|  种类   | 特点  |
|  ----  | ----  |
| Young Space  | GC 执行得比较频繁,存放的也是容易失效的对象 |
| Old Space | GC 执行得少，一般存放的是 Young GC 多次不能回收的变量 |



使用 `--trace_gc` `--trace_gc_verbose` 两个参数，可以打印出 GC 日志
```bash 
$ node --trace_gc --trace_gc_verbose test.js
```


