require("dotenv").config();

// notion client
const notionSDK = require("@notionhq/client");
const notionClient = new notionSDK.Client({
    auth: process.env.NOTION_TOKEN,
});

// notion block parser
const notionBlocks = require("@notion-stuff/blocks-html-parser");
const notionBlockParser = notionBlocks.NotionBlocksHtmlParser.getInstance({
    mdParserOptions: { emptyParagraphToNonBreakingSpace: true },
});

const getDrinks = async function (category) {
    if (!category.has_children) return undefined;

    let children = await notionClient.blocks.children.list({
        block_id: category.id,
    });

    category.children = [...children.results];

    let options = category.children.map((child) => {
        return child.paragraph.rich_text[0].plain_text;
    });

    return {
        name: category.toggle.rich_text[0].plain_text,
        options: options,
    };
};

const getCocktailDetails = async function (cocktail) {
    var blocks = [],
        dividers = [],
        i;

    let blockPage = await notionClient.blocks.children.list({
        block_id: cocktail.id,
    });

    blocks = [...blockPage.results];

    for (i = 0; i < blocks.length; i++) {
        if (blocks[i].type === "divider") dividers.push(i);
    }

    cocktail.ingredients = [];
    cocktail.instructions = [];
    cocktail.notes = dividers[1] == blocks.length - 1 ? null : [];

    blocks.forEach(async (block, index) => {
        if (index < dividers[0]) {
            let ingredient = block.paragraph.rich_text[0].plain_text.split(", ");
            cocktail.ingredients.push({
                measure: ingredient[0],
                name: ingredient[1],
            });
        } else if (index > dividers[0] && index < dividers[1]) {
            cocktail.instructions.push(block.paragraph.rich_text[0].plain_text);
        } else if (index > dividers[1]) {
            cocktail.notes.push(block.paragraph.rich_text[0].plain_text);
        }
    });

    return cocktail;
};

exports.notionClient = notionClient;
exports.notionBlockParser = notionBlockParser;
exports.getDrinks = getDrinks;
exports.getCocktailDetails = getCocktailDetails;
