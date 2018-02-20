import * as _ from "lodash";
import moment from "moment";
import Login from "./app/Services/Login";
import { dirname } from "path";
import colors from "colors";

import readline from "readline";

const { Builder, By, Key, until } = require("selenium-webdriver");
require("dotenv").config();

const dice = async driver => {
  await driver.get(process.env.BASE_URL);

  await driver.sleep(60000);

  console.log("Dice");

  await driver.get(process.env.GAME_URL);
  await driver.sleep(2000);
};

(async function r() {
  while (true) {
    let driver = await new Builder().forBrowser(process.env.WEB_DRIVER).build();
    await dice(driver);
    driver.quit();
  }
})();
