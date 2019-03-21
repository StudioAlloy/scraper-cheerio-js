// External dependencies
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const chalk = require("chalk");

const url =
  "https://www.hepatitisinfo.nl/ContentControls/Facets/kennisbank/cDU136_Kennisbank.aspx?intPage=1";
const outputFile = "export/data.json";
const parsedResults = [];
const pageLimit = 10;
let pageCounter = 0;
let resultCount = 0;

console.log(
  chalk.black.bgBlue(
    `\n  Scraping of ${chalk.underline.bold(url)} initiated...\n`
  )
);

const getWebsiteContent = async url => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // New Lists
    $(".center-pane .article").map((i, el) => {
      const count = resultCount++;
      const title = $(el)
        .find("h4")
        .text();
      const url = $(el)
        .find("h3")
        .attr("href");
      const metadata = {
        count: count,
        title: title,
        url: url,
      };
      parsedResults.push(metadata);
    });

    // Pagination Elements Link
    const nextPageLink = $(".paging .next")
      // .find(".curr")
      // .parent()
      // .next()
      // .find("a")
      .attr("href");
    console.log(chalk.cyan(`  Scraping: ${nextPageLink}`));
    pageCounter++;

    if (pageCounter === pageLimit) {
      exportResults(parsedResults);
      return false;
    }

    getWebsiteContent(nextPageLink);
  } catch (error) {
    exportResults(parsedResults);
    console.error(error);
  }
};

const exportResults = parsedResults => {
  fs.writeFile(outputFile, JSON.stringify(parsedResults, null, 4), err => {
    if (err) {
      console.log(err);
    }
    console.log(
      chalk.black.bgYellow(
        `\n ${chalk.underline.bold(
          parsedResults.length
        )} Results exported successfully to ${chalk.underline.bold(
          outputFile
        )}\n`
      )
    );
  });
};

getWebsiteContent(url);