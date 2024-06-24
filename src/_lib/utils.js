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

exports.notionClient = notionClient;
exports.notionBlockParser = notionBlockParser;
exports.getDrinks = getDrinks;
