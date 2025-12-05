## 如何保证各个loader按照预想方式工作？
- 可以使用enforce强制执行loader，改变loader的执行顺序
- pre: 表示在所有正常loader执行之前，loader会先执行pre的loader
- post: 表示在所有正常loader执行之后，loader会先执行post的loader