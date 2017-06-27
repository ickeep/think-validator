/*
* @Author: lushijie
* @Date:   2017-02-21 18:50:26
* @Last Modified by:   lushijie
* @Last Modified time: 2017-06-27 12:23:38
*/
const helper = require('think-helper');
const ARRAY_SP = '__array__';
const OBJECT_SP = '__object__';
const NOERROR = ' valid failed';
const METHOD_MAP = {
  GET: 'param',
  POST: 'post',
  FILE: 'file',
  PUT: 'post',
  DELETE: 'post',
  PATCH: 'post',
  LINK: 'post',
  UNLINK: 'post'
};
let preRules = require('./rules.js');
let preErrors = require('./errors.js');

class Validator {
  constructor(ctx) {
    this.ctx = ctx;
    this.ctxQuery = {};
    this.requiredValidNames = [
      'required',
      'requiredIf',
      'requiredNotIf',
      'requiredWith',
      'requiredWithAll',
      'requiredWithOut',
      'requiredWithOutAll'
    ];
    this.skippedValidNames = ['value', 'default', 'trim', 'method'].concat(this.requiredValidNames);
    this.basicType = ['int', 'string', 'float', 'array', 'object', 'boolean'];
    this.errors = helper.extend({}, preErrors);
  }

  /**
   * format argName nested array and object
   * @param  {String} argName [description]
   * @return {String}          [description]
   */
  _formatNestedRuleName(argName) {
    let newRuleName = argName;
    if(newRuleName.indexOf(ARRAY_SP) > -1) {
      let tmpRuleName = newRuleName.split(ARRAY_SP);
      newRuleName = tmpRuleName[0] + '[' + tmpRuleName[1]+ ']';
    }
    if(newRuleName.indexOf(OBJECT_SP) > -1) {
      let tmpRuleName = newRuleName.split(OBJECT_SP);
      newRuleName = tmpRuleName[0] + '.' + tmpRuleName[1];
    }
    return newRuleName;
  }

  /**
   * get error message
   * @param  {String} argName        [description]
   * @param  {Object} rule            [description]
   * @param  {String} validName       [description]
   * @param  {Mixed} parsedValidArgs [description]
   * @return {String}                 [description]
   */
  _getErrorMessage(argName, rule, validName, parsedValidArgs) {
    let errMsg;

    // cacl argName first, array use normal custom error style
    if(argName.indexOf(ARRAY_SP) > -1) {
      argName = argName.split(ARRAY_SP)[0];
    }

    // set valid and arg error
    let validNameError = this.errors[validName];
    let argNameError = this.errors[argName];

    if(argName.indexOf(OBJECT_SP) === -1) {
      // eg int: 'error message'
      if(helper.isString(validNameError)) {
        errMsg = validNameError;
      }

      //eg name: 'error message'
      if(helper.isString(argNameError)) {
        errMsg = argNameError;
      }

      //eg name: {int: 'error message'}
      if(helper.isObject(argNameError) && helper.isString(argNameError[validName])) {
        errMsg = this.errors[argName][validName];
      }
    }

    // eg name: {name1,name2: 'error message'}
    // eg name: {name1,name2: {int: 'error message'}}
    if(argName.indexOf(OBJECT_SP) > -1) {
      let parsedResult = argName.split(OBJECT_SP);
      let subRuleName = parsedResult[1];
      argName = parsedResult[0];
      argNameError = this.errors[argName];

      if(helper.isObject(argNameError)) {
        for(let i in argNameError) {
          if(i.split(',').indexOf(subRuleName) > -1){
            if(helper.isObject(argNameError[i])){
              errMsg = argNameError[i][validName];
            }else if(helper.isString(argNameError[i])){
              errMsg = argNameError[i];
            }
          }
        }
      }else if(helper.isString(argNameError)) {
        errMsg = argNameError;
      }
    }

    // format error message rule name
    let originRuleName = this._formatNestedRuleName(argName);

    // set defalut error message
    if(!errMsg) {
      return originRuleName + NOERROR;
    }

    // argName validName validArgs parsedValidArgs
    let validArgs = rule[argName];
    let lastMsg = errMsg.replace('{name}', originRuleName)
      .replace('{args}', JSON.stringify(validArgs))
      .replace('{pargs}', JSON.stringify(parsedValidArgs));
    return lastMsg;
  }

  /**
   * parse valid args by _validName method
   * @param  {String} validName [description]
   * @param  {Mixed} ruleArgs  [description]
   * @return {Mixed}           [description]
   */
  _parseValidArgs(validName, rule) {
    let ruleArgs = rule[validName];
    let pfn = preRules['_' + validName];
    if(helper.isFunction(pfn)){
      // support rewrite back, so just pass this.ctxQuery without clone
      ruleArgs = pfn(ruleArgs, this.ctxQuery);
    }
    return ruleArgs;
  }

  /**
   * convert value by value type
   * @param  {String} argName [description]
   * @param  {Object} rule     [description]
   * @return {Mixed}          [description]
   */
  _convertParamValue(argName, rule) {
    let queryMethod = this._getQueryMethod(rule);
    if((rule.int || rule.float || rule.numeric) && queryMethod) {
      if(argName.indexOf(ARRAY_SP) > -1) {
        let parsedRuleName = argName.split(ARRAY_SP);
        this.ctxQuery[parsedRuleName[0]][parsedRuleName[1]] = parseFloat(rule.value);
      }
      else if (argName.indexOf(OBJECT_SP) > -1) {
        let parsedRuleName = argName.split(OBJECT_SP);
        this.ctxQuery[parsedRuleName[0]][parsedRuleName[1]] = parseFloat(rule.value);
      }
      else {
        this.ctxQuery[argName] = parseFloat(rule.value);
      }
    }
  }

  /**
   * check the value if is required
   * @param  {Object} rule [description]
   * @return {Boolean}      [description]
   */
  _checkRequired(rule) {
    let isRequired = false;
    for(let i = 0; i <= this.requiredValidNames.length; i++) {
      let validName = this.requiredValidNames[i];
      if(rule[validName]) {
        let fn = preRules[validName];
        let parsedValidArgs = this._parseValidArgs(validName, rule);
        if(fn(rule.value, parsedValidArgs)) {
          isRequired = true;
          break;
        };
      }
    }
    return isRequired;
  }

  /**
   * get ctx's method which to get or set the query
   * @param  {Object} rule [description]
   * @return {String}      [methodName]
   */
  _getQueryMethod(rule) {
    let methodName;
    let ctxMethod = this.ctx.method.toUpperCase();
    if(typeof rule.method === 'undefined' || rule.method === '') {
      methodName = ctxMethod;
    }else {
      methodName = rule.method.toUpperCase();
    }
    rule.method = methodName;
    return METHOD_MAP[methodName];
  }

  /**
   * pre treat rule.value & handle the nested array and object valid
   * @param  {Object} rules [description]
   * @return {Object}       [description]
   */
  _preTreatRules(rules) {
    rules = helper.extend({}, rules);

    // to keep the nested rules split from the array or object
    let childRules = {};

    for(let argName in rules) {
      let rule = rules[argName];

      let queryMethod = this._getQueryMethod(rule);
      // skip rule.method not match this.ctx.method
      if(this.ctx.method.toUpperCase() !== rule.method.toUpperCase()) {
        continue;
      }
      // set this.ctxQuery
      this.ctxQuery = this.ctx[queryMethod]();

      // basic type check, only one basic type is legal(ok)
      let containTypeNum = this.basicType.reduce((acc, val) => {
        val = rule[val] ? 1 : 0;
        return acc + val;
      }, 0);

      if(containTypeNum > 1) {
        throw new Error('Any rule can\'t contains one more basic type, the param you are validing is ' + argName);
      }

      // set related value on ctx to rule.value first
      if(!rule.value) {
        rule.value = this.ctxQuery[argName];
      }

      // set default, when rule.value is undefined
      if(typeof(rule.value) === 'undefined' && !helper.isTrueEmpty(rule.default)){
        rule.value = rule.default;
      }

      // trim rule.value, when trim is true
      if(rule.trim && rule.value && rule.value.trim){
        rule.value = rule.value.trim();
      }

      // array convert
      if(rule.array && !helper.isArray(rule.value)) {
        rule.value = [rule.value]
      }

      // boolean convert
      if(rule.boolean) {
        rule.value = ['yes', 'on', '1', 'true', true].indexOf(rule.value) > -1;
      }

      // write back rule.value to ctx, nested children wait for next round to handle
      if(typeof rule.value !== 'undefined' && argName.indexOf(ARRAY_SP) === -1 & argName.indexOf(OBJECT_SP) === -1 && queryMethod){
        this.ctxQuery[argName] = rule.value;
      }

      // array & object children split and set the value
      if(rule.children) {
        let ruleValue = rule.value;
        let ruleChildren = rules[argName].children;
        // delete the argName, like [array|object]: true
        delete rules[argName];

        if(rule.array) {
          for(let i = 0; i < ruleValue.length; i++) {
            let tmpRuleName = argName + ARRAY_SP + i;
            childRules[tmpRuleName] = helper.extend({}, ruleChildren, {value: ruleValue[i]});
          }
        }else {
          for(let key in ruleValue) {
            let tmpRuleName = argName + OBJECT_SP + key;
            childRules[tmpRuleName] = helper.extend({}, ruleChildren, {value: ruleValue[key]});
          }
        }
      }
    }
    let parsedChildRules = {};
    if(Object.keys(childRules).length > 0) {
      parsedChildRules = this._preTreatRules(childRules);
    }
    return helper.extend({}, rules, parsedChildRules);
  }

  /**
   * add custom valid method
   * @param {String}   validName [description]
   * @param {Function} callback  [description]
   * @param {String}   msg       [description]
   */
  static addRule(validName, callback) {
    preRules[validName] = callback;
  }

  /**
   * validate rules
   * @param  {Object} rules [description]
   * @param  {Object} msgs  [custom errors]
   * @return {Object}       {argName: errorMessage}
   */
  validate(rules, msgs) {
    let ret = {};
    let parsedRules = this._preTreatRules(rules);
    this.errors = helper.extend(this.errors, msgs);

    outerLoop:
    for(let argName in parsedRules){
      let rule = parsedRules[argName];

      // skip rule.method not match this.ctx.method
      if(this.ctx.method.toUpperCase() !== rule.method.toUpperCase()) {
        continue;
      }

      // required check
      let isRequired = this._checkRequired(rule);
      if(isRequired && helper.isTrueEmpty(rule.value)) {
        let validName = 'required';
        let parsedValidArgs = this._parseValidArgs(validName, rule);
        let errMsg = this._getErrorMessage(argName, rule, validName, parsedValidArgs);
        ret[argName] = errMsg;
        continue;
      }else if(!isRequired && helper.isTrueEmpty(rule.value)){
        continue;
      }

      // valid check
      for(let validName in rule){
        if(this.skippedValidNames.indexOf(validName) >= 0) {
          continue;
        }

        // check if the valid method is exsit
        let fn = preRules[validName];
        if (!helper.isFunction(fn)) {
          throw new Error(validName + ' valid method is not been configed');
        }

        // get parsed valid options
        let parsedValidArgs = this._parseValidArgs(validName, rule);

        let result = fn(rule.value, parsedValidArgs);
        if(!result){
          let errMsg = this._getErrorMessage(argName, rule, validName, parsedValidArgs);

          // format error message's rule name
          let newRuleName = this._formatNestedRuleName(argName);
          ret[newRuleName] = errMsg;
          continue outerLoop;
        }else {
          // if this is no error, convert the value
          this._convertParamValue(argName, rule);
        }
      }
    }
    return ret;
  }
}

module.exports = Validator;
