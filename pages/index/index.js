//index.js
//获取应用实例
const app = getApp()

let context = wx.createCanvasContext('firstCanvas');
let screenW = 0;

let step = -1;
let touchX = 0;
let touchY = 0;
let pixelWH = 0;
let curColor = '#FFFFFF';
let pickerColors = ['#FFFFFF', '#000000', 'yellow', 'red', 'green', 'gray', '#F0F8FF', '#FAEBD7', '#00FFFF', '#7FFFD4', '#F0FFFF'];
let canvasHistory = [];

let canvasHeight = 0;

Page({
  canvasIdErrorCallback: function (e) {
    console.error(e.detail.errMsg)
  },
  /**
   * 页面的初始数据
   */
  data: {
    curColorIndex:0,
    canvasHeight: 0,
    colors: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '绘画板',
    })
  },
  onReady: function (e) {
    this.setData({colors:pickerColors});
    var that = this
    wx.getSystemInfo({
      success: function (res) {
        screenW = res.screenWidth;
        var rectWH = (screenW / 16);
        pixelWH = rectWH;
        canvasHeight = screenW;
        that.setData({ canvasHeight: screenW })

        // 使用 wx.createContext 获取绘图上下文 context
        context.setFillStyle('black');
        context.fillRect(0, 0, screenW, screenW);

        context.setLineWidth(0.5);
        context.setStrokeStyle('rgba(255, 255, 255, 0.5)');
        for (var i = 0; i <= 16; i++) {
          context.moveTo(0, i * rectWH);
          context.lineTo(screenW, i * rectWH);
        }
        for (var i = 0; i <= 16; i++) {
          context.moveTo(i * rectWH, 0);
          context.lineTo(i * rectWH, screenW);
        }
        context.stroke();
        context.draw(true,function(){
          console.log("画板绘制完成")
          recoredOperation()
        });
      },
    })
  },
  //绘制开始
  touchStart: function (e){
    touchX = e.touches[0].x; // 获取触摸时的原点  
    touchY = e.touches[0].y; // 获取触摸时的原点
    if (touchX > screenW || touchY > screenW){
      return;
    }
    drawPixel(touchX,touchY);
  },

  //绘制过程中
  touchMove: function (e) {
    touchX = e.touches[0].x;
    touchY = e.touches[0].y;
    if (touchX > screenW || touchY > screenW) {
      return;
    }
    drawPixel(touchX, touchY);
  },
  //绘制结束
  touchEnd:function(e){
    recoredOperation()
  },

  //撤销
  undoTouchAction:function(e){
    undo()
  },

  //恢复
  restoreTouchAction:function(e){
    restore()
  },

  //颜色选择
  colorItemTouchAction:function(e){
    var idx = parseInt(e.target.id);
    this.setData({ curColorIndex:idx });
    curColor = pickerColors[idx];
  },

  //保存到相册
  saveToPhotoAlbumAction:function(e){
    saveCanvasImageToPhotoAlbum()
  }
})

//------------------------------ 功能实现 ------------------------------

//保存画板图片到相册
function saveCanvasImageToPhotoAlbum(){
  wx.showModal({
    title: '提示',
    content: '确定保存到相册?',
    success(obj){
      if(obj.confirm){
        wx.canvasToTempFilePath({
          canvasId: 'firstCanvas',
          fileType: 'png',
          quality: 1,
          success(res) {
            var path = res.tempFilePath;
            wx.saveImageToPhotosAlbum({
              filePath: path,
              success(saveRes) {
                wx.showToast({
                  title: 'Success!',
                  icon: 'success'
                })
              }
            })
          }
        }, this)
      }
    }
  })
}

//记录画板的数据
function recoredOperation(){
  step+=1;
  if (step < canvasHistory.length) {
    canvasHistory.length = step + 1;
  }
  wx.canvasGetImageData({
    canvasId: 'firstCanvas',
    x: 0,
    y: 0,
    width: screenW,
    height: screenW,
    success(res) {
      canvasHistory.push(res.data)
      console.log(res.data)
    },fail(){
      console.log("canvasGetImageData fail")
    }
  })
}

//撤销
function undo(){
  console.log('undo')
  if(step > 0){
    step--;
    const imgData = canvasHistory[step];
    wx.canvasPutImageData({
      canvasId: 'firstCanvas',
      data: imgData,
      x: 0,
      y: 0,
      width:screenW,
      height:screenW,
      success(res){
        console.log('success')
      }
    })
  }
}

//恢复
function restore(){
  if(step < canvasHistory.length - 1){
    step++;
    const imgData = canvasHistory[step];
    wx.canvasPutImageData({
      canvasId: 'firstCanvas',
      data: imgData,
      x: 0,
      y: 0,
      width: screenW,
      height: screenW,
      success(res) {
        console.log('success')
      }
    })
  }
}

//绘制像素点
function drawPixel(x, y){
  var px = x < pixelWH ? 0 : parseInt(x / pixelWH) * pixelWH;
  var py = y < pixelWH ? 0 : parseInt(y / pixelWH) * pixelWH;
  context.setFillStyle(curColor);
  context.fillRect(px, py, pixelWH, pixelWH);
  context.draw(true);
}
