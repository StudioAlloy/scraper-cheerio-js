//------------------------------------------------------//
// Setup dependencies
//------------------------------------------------------//
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const chalk = require("chalk");
// END External dependencies

//------------------------------------------------------//
// Setup app logic
//------------------------------------------------------//
const outputFile = "export/data.json";
const parsedResults = [];

// Site specific content
const base_url = "https://www.hepatitisinfo.nl";
const content_url =
  "/ContentControls/Facets/kennisbank/cDU136_Kennisbank.aspx?intPage=";
const pageLimit = 23;
let pageCounter = 1;
let resultCount = 0;
//
// let full_url = `${base_url}${content_url}${pageCounter}`;
// END Setup app logic

//------------------------------------------------------//
// Notify user starting setup
//------------------------------------------------------//
console.log(
  chalk.black.bgBlue(
    `\n  Scraping of ${chalk.underline.bold(base_url)} initiated...\n`
  )
);
// END Notify user starting setup

//------------------------------------------------------//
// Load the web page with all items paginated
//------------------------------------------------------//
const getArchiveContent = async url => {
  try {
    const response = await axios.get(`${base_url}${content_url}${pageCounter}`);
    const $ = cheerio.load(response.data);

    getItemsList($);
    nextPage($);
  } catch (error) {
    exportResults(parsedResults);
    console.error(error);
  }
};

// Get contents of the archive page
const getItemsList = function($) {
  // New Lists
  $(".center-pane .article").map((i, el) => {
    const count = resultCount++;
    const title = $(el)
      .find("h4")
      .text();
    const url = $(el)
      .find("a")
      .attr("href");
    const metadata = {
      count: count,
      title: title,
      url: url,
    };
    console.warn(`Scraping: ${title}`);
    parsedResults.push(metadata);
  });
};

// Get contents of current item page
const getCurrentItemContent = async url => {
  const response = await axios.get(`${url}`);
  const $ = cheerio.load(response.data);
  console.warn($(".article_editor").html());
};
// Go to the next page until pageCounter and pageLimit are the same
const nextPage = function($) {
  // Pagination Elements Link
  const nextPageLink = $(".paging .next").attr("href");
  pageCounter++;

  if (!nextPageLink) {
    exportResults(parsedResults);
    return false;
  }
  // 🏁 Go back to the start until it's finished
  getArchiveContent();
};
// END Load the web page with all items paginated

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

getArchiveContent();
