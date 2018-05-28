// map.js

var app = getApp()
var api = require('../../api/api')

Page({
  data: {
    latitude: 0.0,
    longitude: 0.0,
    markers: [],
    polylines: [],
    includes: [],
    scale: 16
  },
  onLoad: function (options) {
      var data = JSON.parse(options.data)
      console.log(data)

      if (data.latitude){
        this.setData({
          latitude: data.latitude
        }) 
      }

      if (data.longitude) {
        this.setData({
          longitude: data.longitude
        })
      }

      if (data.markers) {
        console.log(data.markers)
        this.setData({
          markers: data.markers
        })
      }

      if (data.polylines) {
        console.log(data.polylines[0].points)
        this.setData({
          polylines: data.polylines,
          scale: 14,
          includes: data.polylines[0].points
        })
      }
  },
  onReady: function () {
  
  },
  onShow: function () {
  
  },
  onHide: function () {
  
  },
  onUnload: function () {
  
  },
  onPullDownRefresh: function () {
  
  },
  onReachBottom: function () {
  
  },
  onShareAppMessage: function () {
  
  },
  onReachBottom: function () {
  
  },
  onPullDownRefresh: function () {
  
  }
})