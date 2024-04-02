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
      // ? Call
      await this.showAccountDetails()
      console.log(`*** ANALIZANDO ${this.currency} ***\n`)
      await this.calculateTrend(this.currency)
      await this.getPrice(this.currency)

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
    } catch (error) {
      console.error(error)
    }
  }

  // Get the price of a symbol
  async getPrice(symbol) {
    try {
      const ticks = await this.api.ticks(symbol)
      ticks.onUpdate().subscribe((tick) => {
        console.log(`El precio actual es: ${tick.raw.quote}`)
      })
    } catch (error) {
      console.error(error)
    }
  }

  // Calculate Trend
  async calculateTrend(symbol) {
    const granularityOptions = {
      "1min": 60,
      "5min": 600,
      "15min": 1800,
      "30min": 3600,
      "1hr": 7200,
    }

    // ? Select temporality
    const selectedGranularity = "1hr"

    try {
      const response = await this.api.candles({
        symbol: symbol,
        granularity: granularityOptions[selectedGranularity],
        range: { count: 70 },
      })

      if (
        response &&
        response._data &&
        response._data.list &&
        response._data.list.length >= 2
      ) {
        const candles = response._data.list

        const firstCandle = candles[0].raw.close
        const lastCandle = candles[candles.length - 1].raw.close

        // console.log(candles.length)
        // console.log(firstCandle)
        // console.log(lastCandle, firstCandle)

        console.log(`Temporalidad de: ${selectedGranularity}`)

        if (firstCandle > lastCandle) {
          console.log(
            `first_close=${firstCandle}, last_close=${lastCandle}: La tendencia es bajista.\n=======================`
          )
        } else if (firstCandle < lastCandle) {
          console.log(
            `first_close=${firstCandle}, last_close=${lastCandle}: La tendencia es alcista.\n=======================`
          )
        } else {
          console.log(
            `first_close=${firstCandle}, last_close=${lastCandle}: La tendencia es neutra.\n=======================`
          )
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
}
