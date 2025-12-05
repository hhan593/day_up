// mandate 授权页面
// qrcode 生成二维码链接
import express from "express";
import qrcode, { toFileStream } from "qrcode";
import jwt from "jsonwebtoken";

const app = express();
const user = {};
const userId = 1;
app.use("/static", express.static("public")); // 静态资源

// 生成二维码并且初始化数据结构
app.get("/qrcode", async (req, res) => {
  user[userId] = {
    token: null, //登录凭证，默认为空
    time: Date.now(), //过期时间倒计时
  };
  // 生成二维码
  const code = await qrcode.toDataURL(
    `http://192.168.159.181:3001/static/mandate.html?userId=${userId}`
  );
  res.json({
    code, //二维码
    userId, //用户id
  });
});
// 登录授权 返回token 更改状态为1 已授权
app.post("/login/:userId", (req, res) => {
  const id = req.params.userId; //获取用户id
  const token = jwt.sign({ id }, "%^^*(assdd)");
  user[id].token = token;
  user[id].time = Date.now();
  res.json({
    // code: 200,
    token,
  });
});
// 检查授权状态 0 未授权 1 已授权
app.get("/check/:userId", (req, res) => {
  const id = req.params.userId;
  if (Date.now() - user[id].time > 1000 * 60 * 1) {
    res.json({
      status: 2,
    });
  } else if (user[id].token) {
    res.json({
      status: 1,
    });
  } else {
    res.json({
      status: 0,
    });
  }
});

app.listen(3001, () => {
  console.log("服务器启动成功");
});
