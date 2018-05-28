function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function getSorted(arr, sortedKeys) {
  var result = []
  for(var i = 0; i < arr.length; i++) {
    result[i] = arr[sortedKeys[i]]
  }
  return result
}

function getObjectValues(arr, valKey) {
  var result = []
  for (var i = 0; i < arr.length; i++) {
      result[i] = arr[i][valKey]
  }
  return result
}

function getLineColor(lineIndicator) {
  var knownLineColors = {
    "1": "#ED3229",
    "2": "#36B854",
    "3": "#F5D11D",
    "4": "#320176",
    "5": "#823094",
    "6": "#CF057A",
    "7": "#F3560F",
    "8": "#1B8CC1",
    "9": "#89C1D9",
    "10": "#C7AFD3",
    "11": "#8C2222",
    "12": "#1B7A61",
    "13": "#EC91CB",
    "16": "#34D2CA",
    "M": "#219192"
  }

  var retval = knownLineColors[lineIndicator]

  return retval
}

function calculateDistance(lat1, long1, lat2, long2) {

  var R = 6371e3 // m

  //radians
  var rLat1 = lat1 * Math.PI / 180
  var rLong1 = long1 * Math.PI / 180
  var rLat2 = lat2 * Math.PI / 180
  var rLong2 = long2 * Math.PI / 180

  var dLat = (lat2 - lat1) * Math.PI / 180
  var dLong = (long2 - long1) * Math.PI / 180

  var a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + 
          Math.cos(rLat1) * Math.cos(rLat2) * 
          Math.sin(dLong/2) * Math.sin(dLong/2)

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  var d = R * c 

  return d
}

function shallowCopy(original) {
  //First create an empty object with same prototype
  //of the original source

  var clone = Object.create(Object.getPrototypeOf(original))

  var i, keys = Object.getOwnPropertyNames(original)

  for (i = 0; i < keys.length; i++) {
    //copy each property into the clone
    Object.defineProperty(clone, keys[i], Object.getOwnPropertyDescriptor(original, keys[i]))
  }

  return clone
}

module.exports = {
  formatTime: formatTime,
  getSorted: getSorted,
  getObjectValues: getObjectValues,
  getLineColor: getLineColor,
  calcDistance: calculateDistance,
  shallowClone: shallowCopy
}
