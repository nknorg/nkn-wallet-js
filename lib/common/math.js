'use strict'

const Decimal = require('decimal.js')

function newNum(arg) {
  return new Decimal(arg)
}

/***
 *
 * @param arg1
 * @param arg2
 * @returns {Decimal}
 */
function add(arg1, arg2) {
  return Decimal.add(arg1, arg2)
}

/***
 *
 * @param arg1
 * @param arg2
 * @returns {Decimal}
 */
function sub(arg1, arg2) {
  return Decimal.sub(arg1, arg2)
}

/***
 *
 * @param arg1
 * @param arg2
 * @returns {Decimal}
 */
function mul(arg1, arg2) {
  return Decimal.mul(arg1, arg2)
}

function mulAndFloor(arg1, arg2) {
  return Decimal.mul(arg1, arg2).floor()
}

/***
 *
 * @param arg1
 * @param arg2
 * @returns {Decimal}
 */
function div(arg1, arg2) {
  return Decimal.div(arg1, arg2)
}

/***
 *
 * @param arg1
 * @param arg2
 * @returns {boolean}
 */
function eq(arg1, arg2) {
  return new Decimal(arg1).eq(arg2)
}

/**
 *
 * @param base
 * @param target
 * @returns {boolean}
 */
function greaterThan(base, target) {
  return new Decimal(base).greaterThan(target)
}

/**
 *
 * @param base
 * @param target
 * @returns {boolean}
 */
function greaterThanOrEqualTo(base, target) {
  return new Decimal(base).greaterThanOrEqualTo(target)
}

/**
 *
 * @param base
 * @param target
 * @returns {boolean}
 */
function lessThan(base, target) {
  return new Decimal(base).lessThan(target)
}

/***
 *
 * @param base
 * @param target
 * @returns {boolean}
 */
function lessThanOrEqualTo(base, target) {
  return new Decimal(base).lessThanOrEqualTo(target)
}

/***
 *
 * @param arg
 * @returns {string}
 */
function int2HexString(arg) {
  let hexString = new Decimal(arg).floor().toHexadecimal().toString().substring(2)

  if(1 === hexString.length % 2) {
    hexString = '0' + hexString
  }

  return hexString
}

/***
 *
 * @param arg
 * @returns {*}
 */
function hexString2Int(arg) {
  return ('0x' === arg.slice(0, 2)) ? new Decimal(arg) : new Decimal("0x" + arg)
}

module.exports = {
  newNum,

  add,
  sub,
  mul,
  div,

  mulAndFloor,

  eq,
  greaterThan,
  greaterThanOrEqualTo,
  lessThan,
  lessThanOrEqualTo,

  int2HexString,
  hexString2Int,
}
