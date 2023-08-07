import { createHmac } from 'crypto'
import { URLSearchParams } from 'url'
import axios, { type AxiosInstance } from 'axios'

import { GBPrimePayApiUrl, GBPrimePayChannels, GBPrimePayEnv, GBPrimePayOptions, GBPrimePayResponse, MerchantInfo, ShortMerchantInfo } from './constants'
import { regexToObject } from './utils'

export class GBPrimePay {
  private $http: AxiosInstance

  private raw: boolean

  private token: string
  private publicKey: string
  private secretKey: string

  constructor(token: string, publicKey: string, secretKey: string, sandbox = false, raw = false) {
    this.token = token
    this.publicKey = publicKey
    this.secretKey = secretKey
    this.raw = raw
    this.$http = axios.create({
      baseURL: sandbox ? GBPrimePayEnv.TEST : GBPrimePayEnv.PROD
    })
  }

  static getChecksum(secretKey: string, ...args: string[]) {
    return createHmac('sha256', secretKey)
      .update(args.join(''))
      .digest('hex')
  }

  /**
   * Get infornation of merchant
   * 
   * @returns Full Merchant Info
   */
  async getMerchantInfo(): Promise<MerchantInfo | null> {
    return await this.$http.get(
      '/getmerchantinfo',
      {
        auth: {
          username: this.publicKey,
          password: ''
        }
      }
    )
      .then(r => r.data)
      .catch(() => null)
  }

  /**
   * Validates Public Key
   * 
   * @returns Short Merchant Info
   */
  async validatePublicKey(): Promise<ShortMerchantInfo | null> {
    return await this.$http.get(
      '/checkPublicKey',
      {
        auth: {
          username: this.publicKey,
          password: ''
        }
      }
    )
      .then(r => r.data)
      .catch(() => null)
  }

  /**
   * Validates Secret Key
   * 
   * @returns Short Merchant Info
   */
  async validateSecretKey(): Promise<ShortMerchantInfo | null> {
    return await this.$http.get(
      '/checkPrivateKey',
      {
        auth: {
          username: this.secretKey,
          password: ''
        }
      }
    )
      .then(r => r.data)
      .catch(() => null)
  }

  /**
   * Validates Token/Customer Key
   * 
   * @returns Short Merchant Info
   */
  async validateToken(): Promise<ShortMerchantInfo | null> {
    return await this.$http.postForm(
      '/checkCustomerKey',
      {
        token: this.token
      }
    )
      .then(r => r.data)
      .catch(() => null)
  }

  /**
   * Create new Payment
   *
   * @param channel - Payment Channel
   * @param options - Options (vary by channel)
   * @returns Response data (vary by channel)
   */
  async create<T extends GBPrimePayChannels>(channel: T, options: GBPrimePayOptions<T>): Promise<GBPrimePayResponse<T>> {
    options.amount = (typeof options.amount == 'number' ? options.amount : parseFloat(options.amount)).toFixed(2) as string
  
    const opt = options as any as Record<string, string>
  
    if (['QR_CASH', 'QR_CREDIT', 'BILL_PAYMENT'].includes(channel)) {
      opt.token = this.token
    }
  
    if (['LINEPAY', 'TRUEWALLET', 'SHOPEEPAY', 'ATOME'].includes(channel)) {
      const { amount, referenceNo, responseUrl, backgroundUrl } = opt
      opt.checksum = GBPrimePay.getChecksum(this.secretKey, amount, referenceNo, responseUrl, backgroundUrl)
      opt.publicKey = this.publicKey
    }
  
    if (['MOBILE_BANKING'].includes(channel)) {
      const { amount, referenceNo, responseUrl, backgroundUrl, bankCode } = opt
      opt.checksum = GBPrimePay.getChecksum(this.secretKey, amount, referenceNo, responseUrl, backgroundUrl, bankCode)
      opt.publicKey = this.publicKey
    }
  
    if (['WECHAT', 'ALIPAY'].includes(channel)) {
      const { amount, referenceNo, backgroundUrl } = opt
      opt.checksum = GBPrimePay.getChecksum(this.secretKey, amount, referenceNo, backgroundUrl)
      opt.publicKey = this.publicKey
    }
  
    const r = await this.$http.postForm(
      GBPrimePayApiUrl[channel],
      opt
    )

    if (!this.raw) {
      if (channel == 'LINEPAY') {
        return r.request.res.responseUrl
      }

      if (channel == 'TRUEWALLET') {
        let matches = (r.data as string).match(/<input type="hidden" name="ptx_id" value="(\d+)"\s?\/?>/)
        if (matches) {
          return matches[1] as any
        }
      }

      if (channel == 'MOBILE_BANKING') {
        if (opt.bankCode == '014') {
          let matches = (r.data as string).match(/<form action="(\S+)" method="get">/)
          if (matches) {
            return matches[1] as any
          }
        }

        if (opt.bankCode == '002') {
          let params = regexToObject(
            r.data as string,
            /(?<!<!--)<input\s+type="hidden"\s+name="([^"]+)"\s+id="[^"]*"\s+value="([^"]+)"\s*\/?>/gmi
          )
          return ('bualuangmbanking://mbanking.payment?' + (new URLSearchParams(params)).toString()) as any
        }
      }
    }
  
    return r.data
  }

  /**
   * Check Payment Status
   *
   * @param referenceNo - Merchant defined reference
   * @returns Response data (vary by channel)
   */
  async check(referenceNo: string) {
    return await this.$http.post(
      '/v1/check_status_txn',
      { referenceNo },
      {
        auth: {
          username: this.secretKey,
          password: ''
        }
      }
    )
      .then(r => r.data)
      .catch(() => null)
  }

  /**
   * (TrueMoney Wallet only) Send OTP Code
   *
   * @param mobileNumber - Mobile Number that registered with TrueMoney
   * @param ptxId - got from `createPayment()`
   * @returns Form object to be submitted to `truemoney_submitOtp()` you have to get and submit OTP Code within 60 secs
   */
  async truemoney_sendOtp(mobileNumber: string, ptxId: string) {
    const r = await this.$http.post(
      '/v1/trueWallet/payment',
      new URLSearchParams({
        mobile_number: mobileNumber,
        ptx_id: ptxId
      }).toString()
    )

    return regexToObject(
      r.data as string,
      /<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]+)"\s*\/?>/gmi
    )
  }

  /**
   * (TrueMoney Wallet only) Resend OTP Code
   *
   * @param ptxId - got from `createPayment()`
   * @returns Form object to be submitted to `truemoney_submitOtp()` you have to get and submit OTP Code within 60 secs
   */
  async truemoney_resendOtp(ptxId: string) {
    const r = await this.$http.get(
      '/true/payments/repeatauthapply',
      {
        params: {
          paymentTransaction: ptxId
        }
      }
    )

    return regexToObject(
      r.data as string,
      /<input\s+type="hidden"\s+name="([^"]+)"\s+value="([^"]+)"\s*\/?>/gmi
    )
  }

  /**
   * (TrueMoney Wallet only) Submit OTP Code
   *
   * @param otpCode - OTP Code
   * @param frmObject - got from `truemoney_sendOtp()` or `truemoney_resendOtp()`
   */
  async truemoney_submitOtp(otpCode: string, frmObject: Record<string, string>) {
    await this.$http.post(
      '/true/payments/verifytokens',
      new URLSearchParams({
        otp_code: otpCode,
        ...frmObject
      }).toString()
    )
  }
}
