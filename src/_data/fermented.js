require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const getDrinks = require("../_lib/utils").getDrinks;

const fermentedPage = process.env.NOTION_FERMENTED_PAGE_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.blocks.children.list({
        block_id: fermentedPage,
    });

    results = [...data.results];

    let drinks = await Promise.all(results.map(getDrinks));

    return drinks.filter((category) => category !== undefined);
};
