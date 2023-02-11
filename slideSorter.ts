

/**
 * Load data
 * Assign CRUD iterant
 * Possible: filter out old stuff
 * per month:
 *      get presentation
 *      filter data
 *      sort data by GC#
 *      make index of slides
 *      move slides around
 */


/**
 * @description
 * @param {GoogleAppsScript.Slides.Presentation} presentation
 * @param {string} objectId
 * @return {*}  {GoogleAppsScript.Slides.Slide}
 */
function getSlideFromObjectID(presentation: GoogleAppsScript.Slides.Presentation, objectId: string): GoogleAppsScript.Slides.Slide {
    let output = presentation.getSlideById(objectId);
    return output;
}

/**
 * @description monolithic slide sorter
 */
function sortSlides() {
    const sortSheet = new SheetData(new RawSheetData(datastoreConfig))
    const rawData = sortSheet.getData()
    const sortData = new kiDataClass(convertKisToSlideEntries(rawData))

    // this is a bit more of a pain than I thought it was going to be...
    /*
        let presentation = SlidesApp.openById("SLIDE ID")
        let slide = presentation.getSlideById("SLIDE PAGE OBJECT ID")
        slide.move(0)

       */

    // need to go hit the whiteboard for a bit before writing this
    // whiteboard has been hit

    const splitKeys = [
        "year",
        "month"
    ]
    
    const outData = sortData.groupDataByMultipleKeys(splitKeys)

    // since we grouped this by year, then month, this will give us an array of kiDataEntries stored at data[year][month]
    for (const year in outData) {
        const yearData = outData[year]
        for (const month in yearData) {
            const presentationObj = getLogbook(year, month);
            // I'm so lazy I'd rather make more classes than rewrite code
            // maybe that just means I'm predisposed to making libraries???

            const monthData: kiDataEntry[] = yearData[month];
            const dataClass = new kiDataClass(monthData);
            // sort from biggest to smallest number
            const sorterArgs: sortArgs = {
                descending: true,
                valueType: sortTypes.number
            };
            dataClass.sort("gasCard", sorterArgs);

            // take the sorted data and turn it into slideDataEntries, which guarantee types.
            const slideData = convertKisToSlideEntries(dataClass.end);

            // make an array of slides
            const slidePositions: string[] = [];
            for (const entry of slideData) {
                // spread operator: basically the same as for looping through an array and pushing all the data separately
                slidePositions.push(...entry.slideIdArray);
            }
            
            for (let i = 0; i < slidePositions.length;i++) {
                const slide = getSlideFromObjectID(presentationObj, slidePositions[i])
                slide.move(i+1)
            }

        }
    }
}


