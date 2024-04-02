import WebSocket from "ws"
import DerivApi from "@deriv/deriv-api/dist/DerivAPI"
import PricePredictionModel from "./model"

export default class TradingBot extends PricePredictionModel {
  constructor(app_id, token, currency) {
    super()
    this.predictionModel = new PricePredictionModel()

    this.app_id = app_id
    this.token = token
    this.currency = currency
    this.previousTick = undefined
    this.ws = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${app_id}`
    )
    this.api = new DerivApi({ connection: this.ws })

    // Initialize features and labels arrays
    this.features = []
    this.labels = []

    // When connection is established
    this.ws.on("open", async () => {
      // ? Call
      await this.showAccountDetails()
      console.log(`*** ANALIZANDO ${this.currency} ***\n`)
      await this.calculateTrend(this.currency)

      await this.predictionModel.train(this.features, this.labels)

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
        `====================\nTu cuenta: ${loginid}\n Tienes un total de: ${balance.currency} ${balance.display} \nTu email: ${email}\n====================`
      )
    } catch (error) {
      console.error(error)
    }
  }

  // Get the price of a symbol
  async getPrice(symbol) {
    try {
      const response = await this.api.candles({
        symbol: symbol,
        granularity: 600,
        range: { count: 1 },
      })

      if (
        response &&
        response._data &&
        response._data.list &&
        response._data.list.length >= 1
      ) {
        const lastCandlePrice = response._data.list[0].raw.close

        const ticks = await this.api.ticks(symbol)
        ticks.onUpdate().subscribe((tick) => {
          console.log(`El precio actual es: ${tick.raw.quote}`)

          if (
            typeof tick.raw.quote === "number" &&
            typeof lastCandlePrice === "number"
          ) {
            const featuresForPrediction = [tick.raw.quote, lastCandlePrice]

            const prediction = this.predictionModel.predict(
              featuresForPrediction
            )
            console.log("Predicción del modelo:", prediction)
          } else {
            console.error("Los datos no son números, no se pueden predecir")
          }
        })
      }
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

        const firstCandlePrice = candles[0].raw.close
        const lastCandlePrice = candles[candles.length - 1].raw.close

        // console.log(candles.length)
        // console.log(firstCandlePrice)
        // console.log(lastCandlePrice, firstCandlePrice)

        console.log(`Temporalidad de: ${selectedGranularity}`)

        if (firstCandlePrice > lastCandlePrice) {
          console.log(
            `first_close=${firstCandlePrice}, last_close=${lastCandlePrice}: La tendencia es bajista.\n=======================`
          )
        } else if (firstCandlePrice < lastCandlePrice) {
          console.log(
            `first_close=${firstCandlePrice}, last_close=${lastCandlePrice}: La tendencia es alcista.\n=======================`
          )
        } else {
          console.log(
            `first_close=${firstCandlePrice}, last_close=${lastCandlePrice}: La tendencia es neutra.\n=======================`
          )
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
}
