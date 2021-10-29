# Getting Started

## 使用说明

### 运行

```bash
# pull image
docker pull cigaret/insights-notifier:latest
# run container
docker run -dit -p 624:624 cigaret/insights-notifier:latest
```

启动之后，可以通过本地的 `localhost:624/api/chatbot` 向系统发送控制指令。
​

```javascript
// 启动并登录
{
  "type": "login"
}
// 发送登录指定之后，系统需要初始化环境和依赖，这段时间可以遍历状态接口获取信息
{
  "type": "status"
}
// 系统准备就绪之后，调用状态接口会返回登录二维码链接
// 访问该链接并使用机器人微信扫描以登录
{
  "qr": "http://login.qr"
}
// 登录成功之后，可以向消息接口发送消息，消息会通过机器人微信发送
// 目前仅支持 insights-grappler 的消息格式，如下：
// 目前消息会被发送至“国务工作监督委员会”群中
{
  "data": [
    {
      "title": "标题",
      "url": "链接",
      "publishTime": 123314124
      "grapTime": 123131231
    }
   ]
}
```

### 开发

```bash
# download repo
git clone git@github.com:we-insight/insights-notifier.git
# build docker
docker build -t cigaret/insights-notifier:latest .
# push docker
docker push cigaret/insights-notifier:latest
```
