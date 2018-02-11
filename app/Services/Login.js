const { Builder, By, Key, until } = require("selenium-webdriver");

const login = async (email, password, driver) => {
  await driver.get(process.env.BASE_URL);
  await driver.findElement(By.css(process.env.LOGIN_BTN_SELECTOR)).click();
  await driver.sleep(2000);
  await driver.findElement(By.css(process.env.EMAIL_SELECTOR)).sendKeys(email);
  await driver.findElement(By.css(process.env.PASSWORD_SELECTOR)).sendKeys(password);
  await driver.findElement(By.css(process.env.SIGN_IN_BTN_SELECTOR)).click();
  console.log("Login success");
  await driver.sleep(5000);
  
};

module.exports = login;
