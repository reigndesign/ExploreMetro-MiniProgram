var hotapp=require('./hotapp');
var publish = true;

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function request(url,data, handler){    
 
    if(publish){
        var apiUrl = url;
        if(data){
           apiUrl = apiUrl + "?" + serialize(data);
        }
        hotapp.request({
            useProxy: true,
            url: apiUrl, // 需要代理请求的网址
            data: {},
            headers: {
              'Content-Type': 'application/json'
            },
            method: 'GET',
            success: handler.success,
            fail: handler.fail,
            complete: handler.complete            
        })
      }else{        
        wx.request({
            url:url,
            data:data || {},
            header:{
                "Content-Type":"application/json"
            },
            success: handler.success,
            fail: handler.fail,
            complete: handler.complete            
        })
      }
}

module.exports={
    request:request
}