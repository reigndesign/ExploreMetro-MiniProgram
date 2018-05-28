//index.js
//获取应用实例
var app = getApp()
var api = require('../../api/api')
var wgs2mars = require('../../utils/wgs2mars')
var utils = require('../../utils/util.js')

Page({
  data: {
    motto: 'Find first and last Shanghai\nsubway trains departure time',
    userInfo: {},
    searchLines: [],
    stationData: [],
    allLines: [],
    lineHeader: '',
    isFocused: false,
    stationLines: [],
    lineStations: [],
    toView: 'line_1',
    topView: "none",
    scrollTop: 150
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this
    //调用应用实例的方法获取全局数据

    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })

    this.getStations()
  },
  getStations: function() {
    var that = this

    api.request('https://exploreshanghai.com/api.json',
      {
        showall: 1,
        method: 'GET'
      }, {
        success: function (res) {
          // success
          console.log('SUCCESS!!')

          var metroData = that.createStationsArray(res.data.stations)
          var stationLines = []

          var dataKeys = Object.keys(metroData)    

          for (var idx = 0; idx < dataKeys.length; idx++) {
              var key = dataKeys[idx]
              var lineColor = utils.getLineColor(key)
              stationLines.push({ name: key, color: lineColor})
              metroData[key] = {name: key, color: lineColor, stations: metroData[key]}
          }

          console.log(metroData)
          that.setData({
            stationData: metroData,
            allLines: metroData,
            searchLines: metroData,
            stationLines: stationLines
          })
        },
        failure: function (res) {
          //failure
        },
        complete: function (res) {
          //complete
        }
      })
  },
  createListByLine: function(stationArray) {
      var that = this

      var stationsByLine = []
      var keys = []
      var nkeys =[]

      for(var sIdx in stationArray){
          var station = stationArray[sIdx]

          var lines = station.lines

          for (var lIdx in lines) {
              var line = lines[lIdx]

              var lineNum = parseInt(line.name, 10)

              var lineName = line.name.toString()

              if (!stationsByLine[lineName]){
                stationsByLine[lineName] = []
                if (isNaN(lineNum)){
                  nkeys.push(line.name)
                } else {
                  keys.push(lineNum)
                }
              }

              stationsByLine[lineName].push(station)
          }
      }

      keys.sort(function (a, b) {
        return a - b
      })

      //var dataLines = keys.concat(nkeys)
      
      var retval = {}
      for (var key in keys) {
        var sKey = keys[key]
        retval[sKey] = stationsByLine[sKey]
      }
      for (var key in nkeys) {
        var sKey = nkeys[key]
        retval[sKey] = stationsByLine[sKey]
      }

      return retval
  },
  createStationsArray: function (stations) {
    var that = this

    var stationObjectArray = []

    for (var sIdx in stations){
        var stationData = stations[sIdx]
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
          stationObj.fullname = englishName + "\n" + chineseName
        }

        stationObj.isLast = false
        var wgsLat = parseFloat(stationData.lat)
        var wgsLng = parseFloat(stationData.lng)
        
        var newCoords = wgs2mars(wgsLng, wgsLat)

        stationObj.lat = newCoords.lat
        stationObj.lng = newCoords.lng

        stationObj.lines = []

        for (var lineIdx in stationData.lines) {
            var line = stationData.lines[lineIdx]

            var lineObj = { name: line.legend, 
                            color: utils.getLineColor(line.legend),
                            data: [] }

            for (var lineDataIdx in stationData.firstlast) {
                var lineData = stationData.firstlast[lineDataIdx]

                if (lineData.line === line.legend) {
                    var dataObj = {
                        destination: lineData.dest,
                        first: lineData.first,
                        last: lineData.last,
                    }
                    lineObj.data.push(dataObj)
                }
          }

          stationObj.lines.push(lineObj)
        }
        stationObjectArray.push(stationObj)
    }

    var sortedStationData = that.createListByLine(stationObjectArray)
    var orderedStationData = that.orderStations(sortedStationData)


    return sortedStationData
  },
  orderStations: function(stationData) {
      
      for (var idx in stationData) {
          var stationArray = []
          var currentDestination = ''
          var line = stationData[idx]

          for(var lIdx in line ) {
            var station = line[lIdx]

            for (var sIdx in station.lines){
              var stationLines = station.lines[sIdx]
              
              if (stationLines.name != idx) {
                  continue 
              } else {

                for (var slIdx in stationLines.data) {
                  var stationLine = stationLines.data[slIdx]
                  if (stationLine.first != undefined && (stationLine.last != undefined)) {
                    var dest = stationLine.destination
                    if (!stationArray[dest]){
                      stationArray[dest] = []
                    }
                    stationArray[dest].push({key: lIdx, name: station.name_en, destination: dest,  first: stationLine.first, last: stationLine.last})
                  }
                }
              }
            }
          }

          for (var sKey in stationArray) {
            var stationList = stationArray[sKey]
            stationArray[sKey] = stationList.sort(function(a, b){
                return a.first.localeCompare(b.first)
            })
          }

        var destCount = Object.keys(stationArray).length

        var reshuffledKeys = []

        if(idx == "2") {
            //Line two is a special case.
            reshuffledKeys = this.shuffleTwo(stationArray)
        }
        else if ( destCount == 3 ){
          //Three terminal stations, also a special case.
          var largeLength = 0

          var largeKey = ''
          var smallKeys = []
          for (var key in stationArray) {
            var station = stationArray[key]

            if (station.length > largeLength) {
              if (largeKey != '') {
                smallKeys.push(largeKey)
              }
              largeKey = key
              largeLength = station.length
            } else {
              smallKeys.push(key)
            }
          }

          var largeArray = stationArray[largeKey]
          var splitOneArray = stationArray[smallKeys[0]]
          var splitTwoArray = stationArray[smallKeys[1]]


          reshuffledKeys = this.shuffleSplitLines(largeArray, splitOneArray, splitTwoArray)
        }
        else{
          //Just get the keys to resort the line.
          reshuffledKeys = this.shuffleLine(stationArray)
        }

        var shuffled = utils.getSorted(stationData[idx], reshuffledKeys)
        var lastStation = shuffled.pop()

        //clone station object since it's the same object in all lines
        var cloneStation = utils.shallowClone(lastStation)

        cloneStation.isLast = true

        shuffled.push(cloneStation)
        stationData[idx] = shuffled
      }
  },
  shuffleLine: function (stationArray) {
    //Get the keys for each direction
    var directionKeys = []
    for (var key in stationArray) {
      directionKeys.push(key)
    }

    var firstDirection = stationArray[directionKeys[0]]
    var secondDirection = stationArray[directionKeys[1]]

    // See if the times are truly in station order
    // the first time and last time should come before the next station

    var useLastTimes = false
    for (var idx = 0; idx < firstDirection.length; idx++){
        var station = firstDirection[idx]
        if (idx > 0){
          if (!(previousStation.first < station.first && previousStation.last < station.last)) {
            firstDirection = firstDirection.sort(function (a, b) {
              return a.last.localeCompare(b.last)
            })
            secondDirection = secondDirection.sort(function (a, b) {
              return a.last.localeCompare(b.last)
            })
            break
          }    
        }
        var previousStation = station
    }

     
      var directionOneKeys = utils.getObjectValues(firstDirection, 'key')
      var directionTwoKeys = utils.getObjectValues(secondDirection, 'key')
      
      
      //Take the first key from direction 2 and put on the end of direction 2 unless the line is a loop
      var lastStation = directionTwoKeys.shift()

      if(directionOneKeys[0] != lastStation) {
        directionOneKeys.push(lastStation)
      }

      return directionOneKeys 
  },
  shuffleTwo: function (lineStations) {
      //Line 2 is a special case
      var largeLength = 0
      var smallLength = 500
      var largeKey = ''
      var smallKey = ''
      for (var key in lineStations) {
        var station = lineStations[key]

        if (station.length > largeLength) {
          largeKey = key
          largeLength = station.length
        }

        if (station.length < smallLength) {
          smallKey = key
          smallLength = station.length
        }
      }

      var bigArray = lineStations[largeKey]
      var smallArray = lineStations[smallKey]
      var lastStationKey = -1
      var keyList = []

      for (var lKey in bigArray) {
        var stationKey = bigArray[lKey].key

        if (bigArray[lKey].name == 'Pudong International Airport') {
          lastStationKey = stationKey
        }
        var matchFound = false
        for (var sKey in smallArray) {
          if (stationKey == smallArray[sKey].key) {
            matchFound = true
            break
          }
        }

        if (!matchFound && stationKey != lastStationKey) {
          keyList.push(stationKey)
        }
      }

      for (var sKey in smallArray) {
        keyList.push(smallArray[sKey].key)
      }

      keyList.push(lastStationKey)

      return keyList
  },
  shuffleSplitLines: function (largeArray, splitOneArray, splitTwoArray, isDisney=false) {
      // Get the common station
      var splitOneKeys = utils.getObjectValues(splitOneArray, 'key')
      var splitTwoKeys = utils.getObjectValues(splitTwoArray, 'key')
      var splitOneCommon = 0
      var splitTwoCommon = 0

      for(var oneIdx = splitOneKeys.length; oneIdx >= 0; oneIdx--){
          splitTwoCommon = splitTwoKeys.indexOf(splitOneKeys[oneIdx])
          if(splitTwoCommon != -1){
            splitOneCommon = oneIdx
            break
          }
      }

      // Get key of link station to search for
      var searchKey = splitOneKeys[splitOneCommon]

      // Get one split
      var splitOne = splitOneKeys.slice(splitOneCommon + 1).reverse()
      // Get the other split
      var splitTwo = splitTwoKeys.slice(splitTwoCommon + 1).reverse()

      //Splice full line stations from link station to end
      var fullRoute = utils.getObjectValues(largeArray, 'key')
      var idx = fullRoute.indexOf(searchKey)

      var mainRoute = fullRoute.slice(idx)
            
      // Find the terminal stations of the splits
      var lastStations = []
      for (var idx = 0; idx < fullRoute.length; idx++){
          searchKey = fullRoute[idx]
          var isElementOfOne = splitOneKeys.indexOf(searchKey) > -1
          var isElementOfTwo = splitTwoKeys.indexOf(searchKey) > -1
          var isElementOfOneSplit = splitOne.indexOf(searchKey) > -1
          var isElementOfTwoSplit = splitTwo.indexOf(searchKey) > -1
          if (!(isElementOfOne || isElementOfTwo || isElementOfOneSplit ||isElementOfTwoSplit)){
            lastStations.push(searchKey)
          }
      }

      //Remove split stations from main route
      var allSplits = splitOne.concat(splitTwo)
      allSplits = allSplits.concat(lastStations)
      mainRoute = mainRoute.filter(function (key) {
        return allSplits.indexOf(key) == -1
      })

      var lastIndexFirst = fullRoute.indexOf(lastStations[0])
      var lastIndexSec = fullRoute.indexOf(lastStations[1])
      var splitOneIndex = fullRoute.indexOf(splitOne[0])
      var splitTwoIndex = fullRoute.indexOf(splitTwo[0])

      var lastStationFirst = largeArray[lastIndexFirst]
      var lastStationSec = largeArray[lastIndexSec]
      var splitOneStation = largeArray[splitOneIndex]
      var splitTwoStation = largeArray[splitTwoIndex]

      var compareStation = (splitOneStation.first < splitTwoStation.first) ? splitOneStation : splitTwoStation

      var isCompareSmaller = compareStation.first > lastStationFirst.first
      var isSplitInOne = splitOne.indexOf(compareStation.key) > -1

      if((isCompareSmaller || !isSplitInOne) && (isSplitInOne || !isCompareSmaller)){
          splitOne.unshift(lastStations[0])
          splitTwo.unshift(lastStations[1])
      } else {
          splitOne.unshift(lastStations[1])
          splitTwo.unshift(lastStations[0])
      }
      
      // Concatenate splits together then add to main route
      var keyList = splitOne.concat(splitTwo)
      keyList = keyList.concat(mainRoute)

      var allStations = splitOneKeys.concat(splitTwoKeys)

      //Get terminal station of the main route
      for (var idx in allStations) {
        if (keyList.indexOf(allStations[idx]) == -1){
          keyList.push(allStations[idx])
        }
      }
    
      return keyList
  },
  showStationDetails: function(event) {

      var data = JSON.stringify(event.currentTarget.dataset.stationDetails)

      wx.navigateTo({
        url: '../stations/stations?data=' + data,
      })
      
  },
  showNearbyStations: function (event){
    wx.navigateTo({
      url: '../stations/stations',
    })
  },
  searchInput: function(event) {

      var lineStations = event.target.dataset.lineStations
      var searchStations = event.target.dataset.searchStations
      var text = event.detail.value

      if (text == '') {
        this.setData({ searchLines: lineStations })
      } else {

         var searchName = text.toLowerCase()

         var re1 = new RegExp("^[\u4E00-\uFA29]*$")
         var re2 = new RegExp("^[\uE7C7-\uE7F3]*$")
      

         var nameIndex = 'name_en'
         var isEn = true

         if (re1.test(text) || re2.test(text)) {
            isEn = false
            nameIndex = 'name_zh'
        }

        var matchedStations = {}

        var removeLines = []

        for (var line in lineStations) {

            var lineObject = lineStations[line]
            var stations = lineObject.stations

            var matches = []

            var lineName = line.toString()

            for (var idx = 0; idx < stations.length; idx++) {
                var station = stations[idx]

                var stationName = station[nameIndex].toLowerCase()
                if (searchName == stationName.substring(0, searchName.length)) {
                  matches.push(station)
                }
              }

              if (matches.length != 0) { 
                  lineStations[line].stations = matches
              } else {
                removeLines.push(line)
              }
          }

          for (var idx = 0; idx < removeLines.length; idx++) {
            var lineToRemove = removeLines[idx]
            delete lineStations[lineToRemove]
          }


          if (isEn && (re1.test(text.charAt(0)) || re2.test(text.charAt(0)))) {
             this.setData({ searchLines: searchStations })
          } else if (matchedStations.length == 0) {
              this.setData({searchLines: [{name_en: "No stations found",
                                          name_zh: "没有地铁站"}]})
          } else {
              console.log(lineStations)
              for (var index in lineStations) {
                var lineStation = lineStations[index]
                var stationsArray = lineStation.stations

                //clone station object since it's the same object in all lines
                var lastStation = stationsArray.pop()
                //console.log(lastStation)
                var cloneStation = utils.shallowClone(lastStation)

                cloneStation.isLast = true

                stationsArray.push(cloneStation)
                lineStation.stations = stationsArray
              }
              this.setData({ searchLines: lineStations })
          }

      }
  },
  resetInput: function(event) {
    
    var lineStations = event.target.dataset.lineStations
    this.setData({ searchLines: lineStations })
  },
  upper: function (e) {
    console.log(e)
  },
  lower: function (e) {
    console.log(e)
  },
  scroll: function (e) {
    console.log(e)
  },
  tapToLine: function (event) {
    var selectedLine = event.currentTarget.dataset.selectedLine

    var newView = "line_"+ selectedLine

    this.setData({
      toView: newView
    })

  },
  tapMove: function (e) {
    this.setData({
      scrollTop: this.data.scrollTop + 10
    })
  }
})
