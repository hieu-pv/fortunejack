import * as _ from "lodash";
import moment from "moment";
import Login from "./app/Services/Login";

const { Builder, By, Key, until } = require("selenium-webdriver");
require("dotenv").config();

(async function dice() {
  let driver = await new Builder().forBrowser("chrome").build();
  await Login(process.env.EMAIL, process.env.PASSWORD, driver);
  let base_amount = Number(process.env.BASE_AMOUNT);
  try {
    let amount = _.clone(base_amount);
    await driver.get(process.env.GAME_URL);
    await driver.sleep(2000);
    let old_value;
    let lose = 0;
    while (true) {
      console.log(`Start ${moment().format("h:mm:ss")} | Bet Amount: ${amount}`);
      while (true) {
        let v = await driver.findElement(By.css(process.env.BET_AMOUNT_SELECTOR)).getAttribute("value");
        await driver.findElement(By.css(process.env.BET_AMOUNT_SELECTOR)).sendKeys(Key.BACK_SPACE);
        if (v === "") {
          break;
        }
      }
      await driver.findElement(By.css(process.env.BET_AMOUNT_SELECTOR)).sendKeys(amount);
      await driver.findElement(By.css(process.env.ROLL_SELECTOR)).click();

      await driver.wait(async () => {
        let value = await driver.findElement(By.css(process.env.RESULT_BAR_SELECTOR)).getText();
        if (value !== old_value) {
          old_value = _.clone(value);
          return true;
        }
      });
      let classes = await driver.findElement(By.css(process.env.RESULT_BAR_SELECTOR)).getAttribute("class");
      let is_win = classes.indexOf("win") > -1;
      let wallet_ammount = await driver.findElement(By.css(process.env.WALLET_AMOUNT_SELECTOR)).getText();
      if (is_win || lose === Number(process.env.MAX_LOSE_TIME)) {
        lose = 0;
        amount = _.clone(base_amount);
        console.log(`----Win ${wallet_ammount}----`);
      } else {
        lose++;
        amount = 2 * amount;
        console.log(`----Lose ${wallet_ammount}----`);
      }
    }
  } finally {
    // await driver.quit();
  }
})();
