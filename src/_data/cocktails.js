require("dotenv").config();
const notion = require("../_lib/utils").notionClient;
const getCocktailDetails = require("../_lib/utils").getCocktailDetails;

const cocktailsDatabase = process.env.NOTION_COCKTAILS_DB_ID;

module.exports = async () => {
    let results = [];

    let data = await notion.databases.query({
        database_id: cocktailsDatabase,
    });

    results = [...data.results];

    while (data.has_more) {
        data = await notion.databases.query({
            database_id: cocktailsDatabase,
            start_cursor: data.next_cursor,
        });

        results = [...results, ...data.results];
    }

    results = results.filter((cocktail) => !cocktail.properties.Unavailable.checkbox);

    let structuredCocktails = await Promise.all(results.map(getCocktailDetails));

    return structuredCocktails
        .filter((cocktail) => !cocktail.properties.Unavailable.checkbox)
        .map((cocktail, index) => {
            return {
                name: cocktail.properties.Name.title[0].plain_text,
                flavors: cocktail.properties.Flavors.rich_text[0].plain_text,
                ingredients: cocktail.ingredients,
                instructions: cocktail.instructions,
                notes: cocktail.notes,
                href: index,
            };
        })
        .sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
};

/* async function getCocktailDetails(cocktail) {
    var blocks = [],
        dividers = [],
        i;

    let blockPage = await notion.blocks.children.list({
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
}
 */
