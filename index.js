import * as _ from "lodash";
import moment from "moment";
import Login from "./app/Services/Login";
import { dirname } from "path";

const { Builder, By, Key, until } = require("selenium-webdriver");
require("dotenv").config();

let base_amount = Number(process.env.BASE_AMOUNT);
let old_value;
let lose = 0;

const dice = async () => {
  let driver = await new Builder().forBrowser("chrome").build();
  await Login(process.env.EMAIL, process.env.PASSWORD, driver);
  try {
    let amount = _.clone(base_amount);
    await driver.get(process.env.GAME_URL);
    await driver.sleep(5000);

    let curren_currency_classes = await driver.findElement(By.css(process.env.CURRENT_CURRENCY_SELECTOR)).getAttribute("class");
    if (curren_currency_classes.indexOf(process.env.CURRENCY) === -1) {
      console.log("Open currency selector");
      await driver.findElement(By.css(process.env.CHANGE_CURRENCY_SELECTOR)).click();
      await driver.sleep(2000);
      await driver.findElement(By.css(`${process.env.CURRENCY_ITEM_SELECTOR}[data-currency='${process.env.CURRENCY}']`)).click();
      console.log("Select currency");
      await driver.sleep(2000);
    }

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
        console.log(`----Win, Amount: ${wallet_ammount}----`);
      } else {
        lose++;
        amount = 2 * amount;
        console.log(`----Lose(${lose} times), Amount: ${wallet_ammount}----`);
      }
      // let profit_amount = await driver.findElement(By.css(process.env.PROFIT_AMOUNT_SELECTOR)).getText();
      // if (Number(profit_amount) > Number(process.env.RESET_WHEN_PROFIT_MORE_THAN)) {
      //   break;
      // }
      // dice();
    }
  } finally {
    // await driver.quit();
  }
};

dice();
