//stations.js
//获取应用实例
var app = getApp()
var api=require('../../api/api')
var wgs2mars = require('../../utils/wgs2mars')
var utils = require('../../utils/util.js')


Page({
  data: {
    stationData: [],
    myLongitude:0.0,
    myLatitude: 0.0,
    latitude: 0.0,
    longitude: 0.0,
    mapLat: 0.0,
    mapLng: 0.0,
    markers: [],
    polylines: [],
    hasDualView: false,
    isMapView: false,
    scale: 15,
    listViewClass: 'list_view_focus',
    mapViewClass: 'map_view',
    distance: 0
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (options) {
    var that = this
    //调用应用实例的方法获取全局数据

    this.getLocation(options.data)
  },
  onReady: function(e){
    this.mapCtx = wx.createMapContext('stationmap')
    this.mapCtx.moveToLocation()
  },
  getLocation: function(stationData) {
    var that = this

    wx.getLocation({
      type: 'gcj02', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: function(res){
        // success
        var latitude = parseFloat(res.latitude)
        var longitude = parseFloat(res.longitude)

        console.log("User Lat: " + latitude)
        console.log("User Long: " + longitude)

       // var marsCoords = wgs2mars(longitude, latitude)
        that.setData({ myLatitude: latitude, myLongitude: longitude})

       //If stationData exists load stationData
       // else get nearby stations
       if(stationData){
         var data = []
         data.push(JSON.parse(stationData))
         
         var stationLat = parseFloat(data[0].lat)
         var stationLng = parseFloat(data[0].lng)

         console.log(stationLat)
         console.log(stationLng)
         //console.log(marsCoords.lat)
         //console.log(marsCoords.lng)

         var distance = utils.calcDistance(stationLat, stationLng, latitude, longitude)

         distance = Math.round(distance)

         if (distance > 999) {
             distance = 1000 * Math.round(distance / 1000)
         }

         data[0].distance = (distance)

         console.log(data)

         that.setData({ stationData: data })
       }else{
         that.loadStationData(latitude, longitude)
       }
       
      }
    })
  },
  loadStationData: function(latitude, longitude){
      var that = this

      api.request('https://exploreshanghai.com/api.json',
                  {latitude: latitude,
                   longitude: longitude,
                   method: 'GET'
                  },{
            success: function(res){
              // success
              console.log('SUCCESS!!')

              var stationData = that.createStationsArray(res.data.stations)

              var marsCoords = wgs2mars(longitude, latitude)
              that.initializeMap(marsCoords.lat, marsCoords.lng, stationData)

              console.log(stationData)
              that.setData({stationData: stationData, hasDualView: true})
            },
            failure:function(res){
              //failure
            },
            complete: function(res){
              //complete
            }
        })
  },
  createStationsArray: function (stations) {
    var that = this

    var stationObjectArray = []

    for (var sIdx in stations) {
      var stationData = stations[sIdx]

      if (stationData.distance > 800) {
        continue
      }

      var stationObj = {}

      var englishName = stationData.names.en
      var chineseName = stationData.names['zh-Hans']

      stationObj.name_en = englishName
      stationObj.name_zh = chineseName

      var fullname = englishName + " " + chineseName
      stationObj.fullname = fullname

      var blankIdx = fullname.lastIndexOf(" ", 20)
      var cardname = fullname.slice(0, blankIdx) + "\n " + fullname.slice(blankIdx)

      stationObj.cardname = cardname

      if (englishName.length > 30) {
        stationObj.fullname = englishName + "\n\t" + chineseName
      }

      stationObj.isLast = false
      var wgsLat = parseFloat(stationData.lat)
      var wgsLng = parseFloat(stationData.lng)

      var newCoords = wgs2mars(wgsLng, wgsLat)

      stationObj.lat = newCoords.lat
      stationObj.lng = newCoords.lng

      stationObj.distance = stationData.distance

      stationObj.lines = []

      for (var lineIdx in stationData.lines) {
        var line = stationData.lines[lineIdx]

        var lineObj = {
          name: line.legend,
          color: utils.getLineColor(line.legend),
          data: []
        }

        for (var lineDataIdx in stationData.firstlast) {
          var lineData = stationData.firstlast[lineDataIdx]

          if (lineData.line === line.legend) {
            var dataObj = {
              destination: lineData.dest,
              first: lineData.first,
              last: lineData.last
            }
            lineObj.data.push(dataObj)
          }
        }

        stationObj.lines.push(lineObj)
      }
      stationObjectArray.push(stationObj)
    }

    return stationObjectArray
  },
  initializeMap: function(lat, lng, stationData) {

      console.log("Initializing map....")

      var markers = []

      var id = 1
      var controls = [
        {
          id: 1,
          iconPath: '/resources/images/map_left.png',
          position: {
            left: 300,
            top: 540 - 60,
            width: 20,
            height: 20
          },
          clickable: true
        },
        {
          id: 2,
          iconPath: '/resources/images/map_up.png',
          position: {
            left: 320,
            top: 540 - 80,
            width: 20,
            height: 20
          },
          clickable: true
        },
        {
          id: 3,
          iconPath: '/resources/images/map_right.png',
          position: {
            left: 340,
            top: 540 - 60,
            width: 20,
            height: 20
          },
          clickable: true
        },
        {
           id: 4,
           iconPath: '/resources/images/map_down.png',
           position: {
             left: 320,
             top: 540 - 40,
             width: 20,
             height: 20
           },
           clickable: true
        },
        {
          id: 5,
          iconPath: '/resources/images/increase.png',
          position: {
            left: 280,
            top: 540 - 110,
            width: 10,
            height: 10
          },
          clickable: true
        },
        {
          id: 6,
          iconPath: '/resources/images/decrease.png',
          position: {
            left: 280,
            top: 540 - 28,
            width: 10,
            height: 10
          },
          clickable: true
        },
        {
          id: 0,
          iconPath: '/resources/images/scale_15.png',
          position: {
            left: 280,
            top: 540 - 100,
            width: 10,
            height: 72
          },
          clickable: false
        }
      ]

      for (var idx in stationData) {
        id += 1
        var markerObj = {}
        var station = stationData[idx]

        markerObj.id = id
        markerObj.latitude = station.lat
        markerObj.longitude = station.lng
        markerObj.title = station.name_en + " - " + station.name_zh

        markers.push(markerObj)
      }


      this.setData({latitude: lat, longitude: lng, mapLat: lat, mapLng: lng, markers: markers, controls: controls})
  },
  toggleListMapView: function(event) {
      var isMapView =  "map" == event.currentTarget.dataset.currentView

      var listButton = 'list_view_focus'
      var mapButton = 'map_view'

      if (isMapView) {
        var listButton = 'list_view'
        var mapButton = 'map_view_focus'
      } else {
        var listButton = 'list_view_focus'
        var mapButton = 'map_view'
      }

      this.setData({isMapView: isMapView, listViewClass: listButton, mapViewClass: mapButton})
  },
  getDirections: function(event){
    var that = this

    var lat = parseFloat(event.target.dataset.stationLat)
    var lng = parseFloat(event.target.dataset.stationLng)
    var userLat = parseFloat(event.target.dataset.userLat)
    var userLng = parseFloat(event.target.dataset.userLng)
    var nameEn = event.target.dataset.stationNameEn
    var nameZh = event.target.dataset.stationNameZh

    var locdata = {station_name_en: nameEn,
                   station_name_zh: nameZh,
                   station_latitude: lat,
                   station_longitude: lng,
                   user_latitude: userLat,
                   user_longitude: userLng}


    if(userLat == 0 && userLng ==0) {
      wx.getLocation({
        type: 'gcj02', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
        success: function (res) {
          // success
          console.log("Getting user location")

          locdata.user_latitude = res.latitude
          locdata.user_longitude = res.longitude

          that.mapStation(locdata)
        }
      })
    } else {
      console.log("Already have user location")
      this.mapStation(locdata)
    }
  },
  mapStation: function(params) {

    var markers = [//{
    //  id: 1,
    //  latitude: params.user_latitude,
    //  longitude: params.user_longitude,
    //  title: "You are here \n 你在这里",
    //},
    {
      id: 2,
      latitude: params.station_latitude,
      longitude: params.station_longitude,
      title: params.station_name_en + " \n " + params.station_name_zh
    }]
    
    var polylines = [{
      points: [{
        latitude: params.user_latitude,
        longitude: params.user_longitude
      },
      {
        latitude: params.station_latitude,
        longitude: params.station_longitude
      }],
      color: '#1A5370DD',
      width: 8,
      dottedLine: false
    }]

    var latAvg = (params.user_latitude + params.station_latitude) / 2
    var lngAvg = (params.user_longitude + params.station_longitude) / 2


    var data = JSON.stringify({
      latitude: latAvg,
      longitude: lngAvg,
      markers: markers,
      polylines: polylines
    })
  
    var parameters = JSON.stringify(data)

    var url = '../map/map?data=' + data

    wx.navigateTo({
      url: url,
    })

  },
  controlAction: function(ctrl){
    var that = this

    console.log(ctrl)
    console.log(this.mapCtx)


    this.mapCtx.getCenterLocation({
      success: function(res){
        var newLng = res.longitude
        var newLat = res.latitude

        var delta = .005

        switch (ctrl.controlId) {
          case 1: newLng += delta
            console.log("Moving map left")
            break
          case 2: newLat -= delta
            console.log("Moving map up")
            break
          case 3: newLng -= delta
            console.log("Moving map right")
            break
          case 4: newLat += delta
            console.log("Moving map down")
            break
          case 5:
          case 6:
            that.mapCtx.getScale({
              success: function (res) {
                var mapScale = res.scale
                mapScale += (ctrl.controlId == 6) ? -1 : 1
                that.setData({ scale: mapScale})
              }
            })
        }

        if(ctrl.controlId < 5) {
          that.setData({ mapLat: newLat})
          that.setData({ mapLng: newLng})
        }
      }
    })
  },
  regionchange: function(e) {
    console.log(e.type)
  },
  onReachBottom: function(){
    //Do something when page reach bottom.
  }
})
