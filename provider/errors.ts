export enum ProviderErrorCode {
  UNKOWN_ERROR = "UNKOWN_ERROR",
  CHATGPT_CLOUDFLARE = "CHATGPT_CLOUDFLARE",
  CHATGPT_UNAUTHORIZED = "CHATGPT_UNAUTHORIZED",
  API_KEY_NOT_SET = "API_KEY_NOT_SET",
  BACKEND_ERROR = "BACKEND_ERROR",
  REQUEST_ERROR = "REQUEST_ERROR"
}

export class ProviderError extends Error {
  code: ProviderErrorCode
  constructor(message: string, code: ProviderErrorCode) {
    super(message)
    this.code = code
  }
}

export class ProviderBackendError extends ProviderError {
  backendError: any
  constructor(error: any) {
    super("backend error", ProviderErrorCode.BACKEND_ERROR)
    this.backendError = error
  }
}
