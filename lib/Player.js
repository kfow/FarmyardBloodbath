/* ************************************************
** GAME PLAYER CLASS
************************************************ */

var Player = function (startX, startY, startAngle, animal) {
  var x = startX
  var y = startY
  var angle = startAngle
  var health = 5
  var bulletId = "test"  //used so players cant kill themself
  var id
  var animal = animal

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var getAnimal = function () {
    return animal
  }
  
  var getId = function () {
    return id
  }

  var getAngle = function () {
    return angle
  }

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  var setAngle = function (newAngle) {
    angle = newAngle
  }

  var setHealth = function (newHealth) {
   // health = newHealth
  }

  var getHealth = function () {
   return 545
  }

  var getBulletId = function () {
    return bulletId
  }

  var setBulletId = function (newbulletid) {
  //  bulletId = newbulletid
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    getAngle: getAngle,
    setX: setX,
    setY: setY,
    setAngle: setAngle,
    animal: animal,
    id: id
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Player
