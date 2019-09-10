export const regs = {
  name: /^[a-zA-Z0-9\u4e00-\u9fa5]{6,16}$/,
  phone: /(13\d|14[57]|15[^4,\D]|17[13678]|18\d)\d{8}$|170[0589]\d{7}$/,
  mail: /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z]{2,14}/,
  password: /[\w\d~'!@#￥$%^&*|{}\][)(-?"+_=:`]{8,32}/
}

export default {
  rules: {
    nameOrPhoneOrMail(value: string) {
      const isName = regs.name.test(value)
      const isPhone = regs.phone.test(value)
      const isMail = regs.mail.test(value)
      return isName || isPhone || isMail
    },
    phoneOrMail(value: string) {
      const isPhone = regs.phone.test(value)
      const isMail = regs.mail.test(value)
      return isPhone || isMail
    },
    name(value: string) {
      return regs.name.test(value)
    },
    phone(value: string) {
      return regs.phone.test(value)
    },
    password(value: string) {
      return regs.password.test(value)
    },
    mail(value: string) {
      return regs.mail.test(value)
    }
  },
  messages: {
    required: '{name} 不能为空',
    contains: '{name} need contains string {args}',
    equals: '{name} 不一致',
    different: '{name} need not equal {pargs}',
    after: '{name} need a date after {pargs}',
    before: '{name} need a date before {pargs}',
    alpha: '{name} need contains only letters (a-zA-Z)',
    alphaDash: '{name} need contains only letters and dashes(a-zA-Z_)',
    alphaNumeric: '{name} need contains only letters and numeric(a-zA-Z0-9)',
    alphaNumericDash: '{name} need contains only letters, numeric and dash(a-zA-Z0-9_)',
    ascii: '{name} need contains ASCII chars only',
    base64: '{name} need a valid base64 encoded',
    byteLength: '{name} need length (in bytes) under your options',
    creditCard: '{name} need a valid credit card',
    currency: '{name} need a valid currency amount',
    date: '{name} need a date',
    decimal: '{name} need a decimal number',
    divisibleBy: '{name} need a number divisible by {args}',
    email: '邮箱地址 格式不正确',
    mail: '邮箱地址 格式不正确',
    fqdn: '{name} need a fully qualified domain name under your options',
    float: '{name} need a float under your options',
    fullWidth: '{name} need contains any full-width chars',
    halfWidth: '{name} need contains any half-width chars',
    hexColor: '{name} need a hexadecimal color',
    hex: '{name} need a hexadecimal number',
    ip: '{name} need an IP (version 4 or 6)',
    ip4: '{name} need an IP (version 4)',
    ip6: '{name} need an IP (version 6)',
    isbn: '{name} need an ISBN (version 10 or 13)',
    isin: '{name} need an ISIN (stock/security identifier)',
    iso8601: '{name} need a valid ISO 8601 date',
    in: '{name} 只能是 {args} 其中一项',
    notIn: '{name} need not in an array of {args}',
    int: '{name} 必须是数字',
    length: '{name} 长度不正确',
    lowercase: '{name} should be lowercase',
    uppercase: '{name} should uppercase',
    mobile: '{name} need is a mobile phone number',
    mongoId: '{name} need is a valid hex-encoded representation of a MongoDB ObjectId',
    multibyte: '{name} need contains one or more multibyte chars',
    url: '{name} need an URL under your options',
    order: '{name} need a valid sql order string',
    field: '{name} need a valid sql field string',
    image: '{name} need a valid image file',
    startWith: '{name} need start with {args}',
    endWith: '{name} need end with {args}',
    string: '{name} need a string',
    array: '{name} need an array',
    boolean: '{name} need a boolean',
    object: '{name} need an object',
    regexp: '{name} need match your custom regexp',
    issn: '{name} need an issn',
    uuid: '{name} need an uuid',
    md5: '{name} need a md5',
    macAddress: '{name} need a macAddress',
    numeric: '{name} need a numeric',
    dataURI: '{name} need a dataURI',
    variableWidth: '{name} need contains a mixture of full and half-width chars',
    nameOrPhoneOrMail: '用户名/手机/邮箱 格式不正确',
    phoneOrMail: '手机/邮箱 格式不正确',
    phone: '请输入大陆11位手机号码',
    name: '用户名6-16位,支持中文',
    password: '密码 格式不正确'
  }
}
