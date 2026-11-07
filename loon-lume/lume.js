/*******************************
脚本名称: lume相机
Loon 适配：http-response lume96resapi.imendon.com/v2/purchase/vip/verification
*******************************/

var body = $response.body.replace(/"isValid":\d+/g,'"isValid":1')
.replace(/"expiredTs":\d+/g,'"expiredTs":9999999999999')
.replace(/"vipType":\d+/g,'"vipType":2')
$done({ body });
