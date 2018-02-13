import * as _ from "lodash";
import moment from "moment";
import Login from "./app/Services/Login";
import { dirname } from "path";
import colors from "colors";

const { Builder, By, Key, until } = require("selenium-webdriver");
require("dotenv").config();

let base_amount = Number(process.env.BASE_AMOUNT);
let old_value;
let lose = 0;
const pi = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184";
const pi_length = pi.length;
let pi_index = Math.round(Math.random() * pi_length) - 1;

let start_lose_time = moment();

let bit_high_value = true;
if (process.env.ALGORITHM === 'high') {
  bit_high_value = true;
} else {
  bit_high_value = false;
}

const dice = async driver => {
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

    if (process.env.AUTO_CACULATE_GOOD_BET_AMOUNT === "true") {
      let balance = await driver.findElement(By.css(process.env.WALLET_AMOUNT_SELECTOR)).getText();
      if (curren_currency_classes.indexOf("btc") > -1) {
        base_amount = Math.round(Number(_.head(balance.split(" ")) * 100000000 / 2000)) / 100000000;
      } else {
        base_amount = Math.round(Number(_.head(balance.split(" ")) / 2000));
      }
      amount = _.clone(base_amount);
    }

    let time = 0;
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

      if (pi_index >= pi_length - 1) {
        pi_index = 0;
      }
      if (process.env.ALGORITHM === 'random') {
        if (Number(pi.charAt(pi_index++)) % 2 === 1) {
          bit_high_value = true;
        } else {
          bit_high_value = false;
        }
      }

      if (bit_high_value) {
        console.log("-------- High");
        await driver.findElement(By.css(process.env.HIGH_ROLL_SELECTOR)).click();
      } else {
        console.log("-------- Low");
        await driver.findElement(By.css(process.env.LOW_ROLL_SELECTOR)).click();
      }


      await driver.wait(async () => {
        let value = await driver.findElement(By.css(process.env.RESULT_BAR_SELECTOR)).getText();
        if (value === "Something happened, did not receive reply in 10 seconds, try again or refresh the page") {
          await driver.get(process.env.GAME_URL);
          time = 0;
          await driver.sleep(5000);
          return true;
        }
        if (value !== old_value) {
          old_value = _.clone(value);
          console.log(`-------- ${value}`);
          return true;
        }
      });

      let classes = await driver.findElement(By.css(process.env.RESULT_BAR_SELECTOR)).getAttribute("class");
      let is_win = classes.indexOf("win") > -1;
      let wallet_ammount = await driver.findElement(By.css(process.env.WALLET_AMOUNT_SELECTOR)).getText();
      if (is_win || lose === Number(process.env.MAX_LOSE_TIME) - 1) {
        lose = 0;
        start_lose_time = moment();
        amount = _.clone(base_amount);
        console.log(`----Win, Amount: ${wallet_ammount}----`.green);
      } else {
        lose++;
        if (lose > 3 && moment().diff(start_lose_time, 'seconds') > 3) {
          amount = _.clone(base_amount);
        } else {
          amount = 2 * amount;
        }
        console.log(`----Lose(${lose} times), Amount: ${wallet_ammount}----`.red);
      }
      if (++time >= Number(process.env.MAX_ROUND)) {
        bit_high_value = !bit_high_value;
        await driver.get(process.env.GAME_URL);
        time = 0;
        await driver.sleep(5000);
        if (process.env.AUTO_CACULATE_GOOD_BET_AMOUNT === "true") {
          let balance = await driver.findElement(By.css(process.env.WALLET_AMOUNT_SELECTOR)).getText();
          if (curren_currency_classes.indexOf("btc") > -1) {
            base_amount = Math.round(Number(_.head(balance.split(" ")) * 100000000 / 2000)) / 100000000;
          } else {
            base_amount = Math.round(Number(_.head(balance.split(" ")) / 2000));
          }
          amount = _.clone(base_amount);
        }
        await driver.sleep(1000);
      }
    }
  } finally {
    // await driver.quit();
  }
};

(async function r() {
  while (true) {
    let driver = await new Builder().forBrowser("chrome").build();
    await dice(driver);
    driver.quit();
  }
})();
