/*******************************
脚本名称: lume相机
原脚本名称: 光卷
原脚本作者：彭于晏
原脚本地址：https://raw.githubusercontent.com/89996462/Quantumult-X/main/ycdz/gj.js
改编作者：許諾
Loon 适配：http-response lume96resapi.imendon.com/v2/purchase/vip/verification
*******************************/

var body = $response.body.replace(/"isValid":\d+/g,'"isValid":1')
.replace(/"expiredTs":\d+/g,'"expiredTs":9999999999999')
.replace(/"vipType":\d+/g,'"vipType":2')
$done({ body });
