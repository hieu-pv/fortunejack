import * as _ from "lodash";
import moment from "moment";
import Login from "./app/Services/Login";
import { dirname } from "path";
import colors from "colors";

import readline from "readline";

const { Builder, By, Key, until } = require("selenium-webdriver");
require("dotenv").config();

let CoinId;
let base_amount = Number(process.env.BASE_AMOUNT);
let old_value;
let lose = 0;
let total_win = 0;
let total_lose = 0;
let total_reset = 0;

const balanceUsernameId = "balanceUsername";
const balanceId = "_dice_bal_txt";
const rollToWinInputId = "r_t_w";
const rollBtnId = "roll";
const switchCurrencyId = "dice_sw_c_btn";
const currencyListId = "dice_list_cont";
const preloadBackdropId = "dice_main_div_prel";
const CoinNameHolder = [{ name: "BTC", id: "16" }, { name: "CLAM", id: "17" }, { name: "LTC", id: "18" }, { name: "DASH", id: "19" }, { name: "XMR", id: "20" }, { name: "XDG", id: "22" }, { name: "PPC", id: "23" }, { name: "NMC", id: "24" }, { name: "RDD", id: "25" }, { name: "NVC", id: "26" }, { name: "FJC", id: "27" }, { name: "ETH", id: "28" }, { name: "ZEC", id: "29" }, { name: "BCH", id: "31" }];
const Coin = _.find(CoinNameHolder, item => item.name === process.env.CURRENCY);
const BetAmountInputId = "dice_bet_amount";
const myBetsTabId = "dice_my_bets";
const AuthEmailInputId = "logName";
const AuthPasswordInputId = "logPassword";
const AuthLoginBtnId = "login";

if (_.isUndefined(Coin)) {
  throw "Currency is not supported";
} else {
  CoinId = Coin.id;
}

const pi = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184";
const pi_length = pi.length;
let pi_index = Math.round(Math.random() * pi_length) - 1;

let start_lose_time = moment();

let bit_high_value = true;
if (process.env.ALGORITHM === "high") {
  bit_high_value = true;
} else {
  bit_high_value = false;
}

const dice = async driver => {
  await driver.get(process.env.BASE_URL);

  await driver.findElement(By.id(AuthEmailInputId)).sendKeys(process.env.EMAIL);
  await driver.findElement(By.id(AuthPasswordInputId)).sendKeys(process.env.PASSWORD);
  await driver.findElement(By.id(AuthLoginBtnId)).click();

  console.log("Please verify google captcha if needed");

  await driver.wait(until.elementLocated(By.id(balanceUsernameId)), 120000);

  const username = await driver.findElement(By.id(balanceUsernameId)).getText();

  console.log(`Logged in as ${username.green}`);

  await driver.get(process.env.GAME_URL);

  await driver.wait(() => {
    return driver
      .findElement(By.id(preloadBackdropId))
      .getCssValue("display")
      .then(display => display === "none");
  });

  await driver.findElement(By.id(myBetsTabId)).click();

  if (Coin.name != "BTC") {
    await driver.findElement(By.id(switchCurrencyId)).click();

    await driver.wait(until.elementLocated(By.id(`dice_btn_${CoinId}`)), 2000);

    await driver.findElement(By.id(`dice_btn_${CoinId}`)).click();
  }
  await driver.wait(() => {
    return driver
      .findElement(By.id(preloadBackdropId))
      .getCssValue("display")
      .then(display => display === "none");
  });

  console.log("Start game");

  let amount = _.clone(base_amount);
  if (process.env.AUTO_CACULATE_GOOD_BET_AMOUNT === "true") {
    let balance = await driver.findElement(By.id(balanceId)).getText();
    if (Coin.name === "BTC") {
      base_amount = Math.round(Number(_.head(balance) * 100000000 / 2000)) / 100000000;
    } else {
      base_amount = Math.round(Number(_.head(balance) / 2000));
    }
    amount = _.clone(base_amount);
  }

  let time = 0;
  while (true) {
    console.log(`Start ${moment().format("h:mm:ss")} | Bet Amount: ${amount}`);
    while (true) {
      let v = await driver.findElement(By.id(BetAmountInputId)).getAttribute("value");
      await driver.findElement(By.id(BetAmountInputId)).sendKeys(Key.BACK_SPACE);
      if (v === "") {
        break;
      }
    }

    await driver.findElement(By.id(BetAmountInputId)).sendKeys(amount);

    if (pi_index >= pi_length - 1) {
      pi_index = 0;
    }
    if (process.env.ALGORITHM === "random") {
      if (Number(pi.charAt(pi_index++)) % 2 === 1) {
        bit_high_value = true;
      } else {
        bit_high_value = false;
      }
    }

    let currentRoll;
    if (bit_high_value) {
      console.log("-------- High");
      currentRoll = await driver.findElement(By.id(rollToWinInputId)).getText();
      if (currentRoll !== "ROLL OVER TO WIN") {
        await driver.findElement(By.id(rollToWinInputId)).click();
        await driver.wait(async () => {
          let value = await driver.findElement(By.id(rollToWinInputId)).getText();
          if (value === "ROLL OVER TO WIN") {
            return true;
          }
        });
      }
    } else {
      console.log("-------- Low");
      currentRoll = await driver.findElement(By.id(rollToWinInputId)).getText();
      if (currentRoll !== "ROLL UNDER TO WIN") {
        await driver.findElement(By.id(rollToWinInputId)).click();
        await driver.wait(async () => {
          let value = await driver.findElement(By.id(rollToWinInputId)).getText();
          if (value === "ROLL UNDER TO WIN") {
            return true;
          }
        });
      }
    }

    // Roll
    await driver.findElement(By.id(rollBtnId)).click();

    await driver.wait(() => {
      return driver
        .findElement(By.id(rollBtnId))
        .getCssValue("pointer-events")
        .then(pointer => pointer === "auto");
    });

    let last_dice_color = await driver.findElement(By.css("#dice_list_holder .dice_list_line_p_act .dice_list_line > span:last-child")).getCssValue("color");
    let rolledValue = await driver.findElement(By.css("#dice_list_holder .dice_list_line_p_act .dice_list_line > span.dice_list_roll > span")).getText();

    console.log(`-------- Rolled: ${rolledValue}`);

    let is_win = last_dice_color === "rgba(13, 110, 52, 1)";

    let wallet_ammount = await driver.findElement(By.id(balanceId)).getText();
    if (is_win) {
      lose = 0;
      total_win++;
      start_lose_time = moment();
      amount = _.clone(base_amount);
      console.log(`---- Win, Amount: ${wallet_ammount} ----`.green);
    } else {
      total_lose++;
      lose++;
      if (lose === Number(process.env.MAX_LOSE_TIME)) {
        lose = 0;
        total_reset++;
        start_lose_time = moment();
        amount = _.clone(base_amount);
      } else {
        if (lose == 5 && moment().diff(start_lose_time, "seconds") < 3) {
          amount = _.clone(base_amount);
          start_lose_time = moment();
        } else {
          amount = 2 * amount;
        }
      }

      console.log(`---- Lose(${lose} times), Amount: ${wallet_ammount} ----`.red);
      console.log(`---- Total Win: ${total_win}, Lose: ${total_lose}, Reset: ${total_reset} ----`);
    }
    // if (++time >= Number(process.env.MAX_ROUND)) {
    //   bit_high_value = !bit_high_value;
    //   await driver.get(process.env.GAME_URL);
    //   time = 0;
    //   await driver.sleep(5000);
    //   if (process.env.AUTO_CACULATE_GOOD_BET_AMOUNT === "true") {
    //     let balance = await driver.findElement(By.css(process.env.WALLET_AMOUNT_SELECTOR)).getText();
    //     if (curren_currency_classes.indexOf("btc") > -1) {
    //       base_amount = Math.round(Number(_.head(balance.split(" ")) * 100000000 / 2000)) / 100000000;
    //     } else {
    //       base_amount = Math.round(Number(_.head(balance.split(" ")) / 2000));
    //     }
    //     amount = _.clone(base_amount);
    //   }
    //   await driver.sleep(1000);
    // }
  }
};

(async function r() {
  //   while (true) {
  let driver = await new Builder().forBrowser(process.env.WEB_DRIVER).build();
  await dice(driver);
  // driver.quit();
  // }
})();
