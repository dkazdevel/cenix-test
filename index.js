import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as os from 'os';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const link = process.argv[2];
  const region = process.argv[3];
  const regionSelector = '[class^="FirstHeader_region__"]';
  const modalSelector = '[class^="Modal_root"]';
  const productInfo = {};
  const writeStream = fs.createWriteStream('product.txt');

  await page.goto(link);
  await page.setViewport({width: 1280, height: 1024});

  await page.waitForSelector(regionSelector, {visible: true});

  await page.click(regionSelector);
  await page.waitForSelector(modalSelector);

  const [regionButton] = await page.$x(`//div[contains(text(), '${region}')]`);

  if (regionButton) {
    await regionButton.click();
  } else {
    throw new Error('Please, check the region you requested');
  }

  await page.waitForSelector(modalSelector, {hidden: true});

  try {
    productInfo.oldPrice = await page.evaluate(() => {
      return document
        .querySelector(
          'div[class^="BuyQuant_oldPrice"] span[class^=Price_price]',
        )
        .innerHTML.split('<')[0];
    });
  } catch (e) {
    productInfo.oldPrice = null;
  }

  productInfo.oldPrice &&
    writeStream.write(`priceOld: ${productInfo.oldPrice} ${os.EOL}`);

  productInfo.newPrice = await page.evaluate(() => {
    return document
      .querySelector('div[class^="BuyQuant_price"] span[class^=Price_price]')
      .innerHTML.split('<')[0];
  });

  writeStream.write(
    `${
      productInfo.oldPrice
        ? `priceNew: ${productInfo.newPrice}`
        : `price: ${productInfo.newPrice}`
    } ${os.EOL}`,
  );

  productInfo.rating = await page.evaluate(() => {
    return document
      .querySelector('div[itemprop^="ratingValue"]')
      .innerHTML.split('<')[0];
  });

  writeStream.write(`rating: ${productInfo.rating} ${os.EOL}`);

  productInfo.reviewCount = await page.evaluate(() => {
    return document
      .querySelector('div[class^="ActionsRow_reviews"] button span')
      .innerHTML.split('<')[0];
  });

  writeStream.write(`reviewCount: ${productInfo.reviewCount} ${os.EOL}`);

  await page.screenshot({path: 'screenshot.jpg', fullPage: true});

  writeStream.end();

  await browser.close();
})();
