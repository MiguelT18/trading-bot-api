import TradingBot from "./api/bot"

const app_id = process.env.APP_ID
const token = process.env.TOKEN

const api = new TradingBot(app_id, token, "BOOM500")
