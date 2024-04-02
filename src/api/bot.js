import WebSocket from "ws"
import DerivApi from "@deriv/deriv-api/dist/DerivAPI"

export default class TradingBot {
  constructor(app_id, token, currency) {
    this.app_id = app_id
    this.token = token
    this.currency = currency
    this.previousTick = undefined
    this.ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${app_id}`
    )
    this.api = new DerivApi({ connection: this.ws })

    // When connection is established
    this.ws.on("open", async () => {
      // ? Call methods
      this.showAccountDetails()
      this.keepAlive()
    })
  }

  // Send ping message every 30secs
  keepAlive() {
    setInterval(() => {
      const sendMessage = JSON.stringify({ ping: 1 })
      this.ws.send(sendMessage)
    }, 30000)
  }

  // Show Account Information
  async showAccountDetails() {
    try {
      const account = await this.api.account(this.token)

      const { balance, loginid, email } = account

      console.log(
        `====================\nYou current balance is: ${balance.currency} ${balance.display}\nDeriv Account: ${loginid}\nYour email is: ${email}\n====================`
      )

      await this.getPrice(this.currency)
    } catch (error) {
      console.error(error)
    }
  }

  // Get the price of a symbol
  async getPrice(symbol) {
    try {
      const ticks = await this.api.ticks(symbol)
      ticks.onUpdate().subscribe((tick) => {
        console.log(`El precio actual de ${symbol} es: ${tick.raw.quote}`)
      })
    } catch (error) {
      console.error(error)
    }
  }
}
