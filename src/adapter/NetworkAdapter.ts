/***************************************************
 * Created by nanyuantingfeng on 2019/11/28 17:24. *
 ***************************************************/
import { IIdentifier, IType } from 'datx'
import { IDictionary } from 'datx-utils'
import { INetworkAdapter, IRequestMethod, IRequestOptions, IResponseData, ISingleOrMulti } from '../interfaces'
import { appendParams, prefixURL, prepareQS, prepareSelector, prepareURL } from './helpers'
import { isBrowser } from '../helpers/utils'

export class NetworkAdapter implements INetworkAdapter {
  private readonly baseUrl: string
  private readonly fetchInstance: typeof fetch

  constructor(baseUrl: string)
  constructor(baseUrl: string, fetchInstance?: typeof fetch)
  constructor(baseUrl: string, options?: Partial<{ params: any; headers: any }>)
  constructor(baseUrl: string, fetchInstance?: typeof fetch, options?: Partial<{ params: any; headers: any }>)

  constructor(baseUrl: string, fetchInstance?: any, options?: any) {
    this.baseUrl = baseUrl

    if (fetchInstance && typeof fetchInstance !== 'function') {
      options = fetchInstance
      fetchInstance = undefined
    }

    this.fetchInstance = fetchInstance
    this.defaultFetchOptions = Object.assign({}, this.defaultFetchOptions, options)

    if (!fetchInstance && !isBrowser) {
      throw new Error('Fetch reference needs to be defined before using the network')
    }

    if (isBrowser && !fetchInstance) {
      this.fetchInstance = window.fetch.bind(window)
    }
  }

  defaultFetchOptions: any = { headers: { 'content-type': 'application/json' } }

  prepare(props: {
    type: IType
    endpoint: string
    ids?: ISingleOrMulti<IIdentifier>
    options?: IRequestOptions
    method?: IRequestMethod
  }): { url: string; options?: any; cacheKey: string } {
    const options = props.options || {}

    const url = prepareURL(props.endpoint, props.type, props.ids)
    const { headers: defaultHeaders, params: defaultParams, ...defaultOthers } = this.defaultFetchOptions

    const fixedURL = appendParams(prefixURL(url, this.baseUrl, options.action), prepareQS(Object.assign({}, defaultParams, options.params)))

    const requestHeaders: IDictionary<string> = options.headers || {}
    let uppercaseMethod = props.method.toUpperCase()
    let body = options.data
    let cacheKey = undefined

    if (uppercaseMethod === 'GET' && options.selector) {
      const selectBody = prepareSelector(options.selector)

      const selectBodyString = JSON.stringify(selectBody)
      if (selectBodyString !== '{}') {
        // If it's a `selector` call, switch to the `POST` procedure
        // to ensure the parameter integrity of the `body`
        uppercaseMethod = 'POST'
        body = { ...body, ...selectBody }
      }

      cacheKey = fixedURL + ':' + selectBodyString
    }

    const isBodySupported = uppercaseMethod !== 'GET' && uppercaseMethod !== 'HEAD'
    const reqHeaders: IDictionary<string> = Object.assign({}, defaultHeaders, requestHeaders)

    const options2 = Object.assign({}, defaultOthers, {
      body: (isBodySupported && JSON.stringify(body)) || undefined,
      headers: reqHeaders,
      method: uppercaseMethod
    })

    return { url: fixedURL, options: options2, cacheKey }
  }

  async fetch(url: string, options: any): Promise<IResponseData> {
    let status: number
    let headers: Headers
    const request: Promise<void> = Promise.resolve()
    const requestHeaders = options.headers
    try {
      let responseData: any
      try {
        await request
        let response: Response = await this.fetchInstance(url, options)
        status = response.status
        headers = response.headers
        responseData = await response.json()
      } catch (error) {
        if (status === 204) {
          responseData = null
        }
        throw error
      }

      let result: IResponseData = {}

      if (responseData.value) {
        result.data = responseData.value
      }

      if (responseData.items && Array.isArray(responseData.items)) {
        result.data = responseData.items
        result.meta = { count: responseData.count }
      }

      if (status >= 400) {
        throw { message: `Invalid HTTP status: ${status}`, status }
      }

      return { data: result, headers, requestHeaders, status }
    } catch (error) {
      return this.onError({ error, headers, requestHeaders, status })
    }
  }

  onError(error: IResponseData) {
    return error
  }
}
