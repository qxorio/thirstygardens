module.exports = function (eleventyConfig) {
    /*** BUILD ***/
    eleventyConfig.addPassthroughCopy("src/assets/fonts");
    //eleventyConfig.addPassthroughCopy("src/assets/meta");
    eleventyConfig.addPassthroughCopy("src/assets/img");
    //eleventyConfig.addPassthroughCopy("src/assets/js");

    return {
        // These are all optional, defaults are shown:
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "_site",
        },
    };
};
