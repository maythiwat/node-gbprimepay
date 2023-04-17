export enum GBPrimePayBankCodes {
  KPLUS = '004',
  SCB_EASY = '014',
  KMA = '025',
  BBL = '002',
  KTB = '006'
}

export enum GBPrimePayChannels {
  QR_CASH = 'QR_CASH',
  LINEPAY = 'LINEPAY',
  TRUEWALLET = 'TRUEWALLET',
  SHOPEEPAY = 'SHOPEEPAY',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  MOBILE_BANKING = 'MOBILE_BANKING'
}

export enum GBPrimePayEnv {
  PROD = 'https://api.gbprimepay.com',
  TEST = 'https://api.globalprimepay.com'
}

export enum GBPrimePayApiUrl {
  QR_CASH = '/v3/qrcode/text',
  LINEPAY = '/v2/linepay',
  TRUEWALLET = '/v2/trueWallet',
  SHOPEEPAY = '/v1/shopeePay',
  WECHAT = '/v2/wechat',
  ALIPAY = '/alipay/api/alipay',
  MOBILE_BANKING = '/v2/mobileBanking'
}

interface GBPrimePayBaseOptions {
  amount: string | number
  referenceNo: string
  backgroundUrl?: string
  detail?: string
  customerName?: string
  customerEmail?: string
  merchantDefined1?: string
  merchantDefined2?: string
  merchantDefined3?: string
  merchantDefined4?: string
  merchantDefined5?: string
  customerTelephone?: string
  customerAddress?: string
}

interface GBPrimePayQrCashOptions extends GBPrimePayBaseOptions {
  // token: string
}

interface GBPrimePayTrueWalletOptions extends GBPrimePayBaseOptions {
  // publicKey: string
  backgroundUrl: string
  responseUrl: string
  customerTelephone: string
  // checksum: string
}

interface GBPrimePayLinePayOptions extends GBPrimePayBaseOptions {
  // publicKey: string
  detail: string
  responseUrl: string
  // checksum: string
  rememberWithToken?: string
}

interface GBPrimePayShopeePayOptions extends GBPrimePayBaseOptions {
  // publicKey: string
  backgroundUrl: string
  responseUrl: string
  // checksum: string
}

interface GBPrimePayWechatOptions extends GBPrimePayBaseOptions {
  // publicKey: string
  backgroundUrl: string
  detail: string
  // checksum: string
}

interface GBPrimePayAlipayOptions extends GBPrimePayBaseOptions {
  // publicKey: string
  backgroundUrl: string
  detail: string
  // checksum: string
}

interface GBPrimePayMobileBankingOptions extends GBPrimePayBaseOptions {
  backgroundUrl: string
  responseUrl: string
  bankCode: GBPrimePayBankCodes
}

export type GBPrimePayOptions<T> =
  T extends GBPrimePayChannels.QR_CASH ? GBPrimePayQrCashOptions :
  T extends GBPrimePayChannels.LINEPAY ? GBPrimePayLinePayOptions :
  T extends GBPrimePayChannels.TRUEWALLET ? GBPrimePayTrueWalletOptions :
  T extends GBPrimePayChannels.SHOPEEPAY ? GBPrimePayShopeePayOptions :
  T extends GBPrimePayChannels.WECHAT ? GBPrimePayWechatOptions :
  T extends GBPrimePayChannels.ALIPAY ? GBPrimePayAlipayOptions :
  T extends GBPrimePayChannels.MOBILE_BANKING ? GBPrimePayMobileBankingOptions : never

export type GBPrimePayResponse<T> = 
  T extends GBPrimePayChannels.QR_CASH ? Record<string, string> : string