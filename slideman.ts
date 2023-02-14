/* FLOW
Open folder with documents in it OR load from a sheet that has that data in it
then open up presentation.  If none exists, copy from template, rename " $month $year : gas receipts and logbooks"

Load up slide positioning data from datastore.  If none exists, we're  going to have to load all the data for the whole month

For entry {gas | logbook } that hasn't been logged (or all of them if there's no positional data)
    create new slide, possibly from template
    *APPEND, DON'T ENTER*
    store sheet id on slide, update positional data
    stick basic info about vehicle stuff in the top corner or somewhere
    stick photo on slide (that's already been messed with, if it needs anything)
    (should i  - nahhh, we're just going to do it this way)
    Could do gas receipts and mileage logs in separate presentations?

    one slide for the mileage log, and *n* slides where n = ceil( #receiptPhotos / 2 )

    update positional datastore
    update output datastore

// */
// function tester() {
//     // load up the logbook we need - this will need to change to loading EVERY logbook we need in the future ....
//     let presentation = getLogbook(2022, "August");
//     // load up the data we're going to work with 
//     let slidedataStore: sheetDataEntry = datastoreConfig
//     let slideSheetData = new SheetData(new RawSheetData(slidedataStore))
//     let logResponseDatastore:sheetDataEntry = responseConfig
//     let entryData = new SheetData(new RawSheetData(logResponseDatastore))

//     let entryClass = new kiDataClass(entryData.getData())
//     // save where we are with responses so that we don't wind up with duplicates.  Marking as pulled happens at the very very end.
//     let responseQTY = entryClass.end.length


//     // filter to only new responses, and then add them to the correct thing.
//     //@ts-ignore not sure how to guarantee that this will have all of the req'd fields, but it should by definii
//     let newResponses:logResponseEntry[] = entryClass.removeMatching("pulled", true)

//     let slideDataObj: kiDataClass = new kiDataClass(slideSheetData.getData())
//     //blah @ts-ignore not sure how to require .end to return a particular subtype yet...
//     let slideData: slideDataEntry[] = convertKisToSlideEntries(slideDataObj.end)
//     let newData:slideDataEntry[] = []
//     // let initialIndex = buildPositionalIndex(slideDataObj.end, "keyToBaseOffOf")

//     for (let response of newResponses) {
//         // build index, because it gets out of date

//         let newSlides: slideDataEntry = addSlidesForEntry(response, presentation, slideData)
//         slideData.push(newSlides)
//         newData.push(newSlides)
//     }
//     slideSheetData.insertData(newData)



// }


function addSlidesForEntry(responseData: logResponseEntry, targetPresentation: GoogleAppsScript.Slides.Presentation, positionalIndex: positionalIndex): slideDataEntry {

    let outEntry: slideDataEntry = {
        gasCard: 0,
        logPageIdList: '',
        receiptPageIdList: '',
        month: '',
        year: '',
        logPageIdArray: [],
        receiptPageIdArray: [],
        startPosition: -1,
        slideIdList: '',
        slideIdArray: []
    };

    outEntry.gasCard = +responseData.card_number;
    outEntry.logPageIdList = String(responseData.log_pics);
    outEntry.receiptPageIdList = String(responseData.gas_pics);

    // uses the moved photos in the shared drive thingy instead of the ones in the form responses if it's possible to.
    if (responseData.stored_log_pics && responseData.stored_log_pics != "") {
        outEntry.logPageIdList = String(responseData.stored_log_pics);
    }
    if (responseData.stored_gas_pics && responseData.stored_gas_pics != "") {
        outEntry.receiptPageIdList = String(responseData.stored_gas_pics);
    }
    outEntry.month = responseData.report_month;
    outEntry.year = responseData.report_year;

    // Step 1: build index to figure out where we're supposed to stick data

    // WYLO: trying to figure out the right order for how to do this 

    // WYLO 2022-10-06 : need to break this out into a function properly so that I can reuse things cleanly.  Might have two functions, one for gas & one for logs, or an internal if for switching between the two.
    //let postSlideId = getSlideToInsertBefore(targetPresentation, Number(responseData.gasCard), positionalIndex);
    // outEntry.startPosition = positionalIndex

    // part of the retrofit to let us sort things
    let slideObjects: GoogleAppsScript.Slides.Slide[] = [];

    let logPages = outEntry.logPageIdList.trim().split(",");
    outEntry.logPageIdArray = logPages;
    let iterant = 0;
    for (let entry of logPages) {

        let logSlide = createNewSlide_(targetPresentation /*, postSlideId*/);

        logSlideEditor(logSlide, responseData, entry, iterant);
        slideObjects.push(logSlide)
        iterant += 1;
        // , logSlides.length)

    }
    let receiptURL: string;

    let receiptPics = outEntry.receiptPageIdList.trim().split(",");
    outEntry.receiptPageIdArray = receiptPics;
    // let receiptIterant = 0
    for (let i = 0; i < receiptPics.length; i += 2) {
        let entry1url = receiptPics[i];
        let entry2url: string | null = null;
        if (i + 1 < receiptPics.length) {
            entry2url = receiptPics[i + 1];

        }
        let gasSlide = createNewSlide_(targetPresentation/*, postSlideId*/);
        gasSlideEditor(gasSlide, responseData, entry1url, entry2url, i);
        slideObjects.push(gasSlide)
    }
    for (let slide of slideObjects) {
        outEntry.slideIdArray.push(slide.getObjectId())
    }
    /*
        WYLO 2: not done defining types on my way to TS-verified results

    */
    outEntry.slideIdList = outEntry.slideIdArray.join(",")
    return outEntry;

}

/**
 * @description This originally did more stuff but doesn't anymore because we made sorting external b/c it's cheap
 * @param {GoogleAppsScript.Slides.Presentation} targetPresentation
 * @return {*}  {GoogleAppsScript.Slides.Slide}
 */
function createNewSlide_(targetPresentation: GoogleAppsScript.Slides.Presentation): GoogleAppsScript.Slides.Slide {
    let outSlide: GoogleAppsScript.Slides.Slide;
    outSlide = targetPresentation.appendSlide();
    return outSlide;
}


/**
 * Which way is the sheet going?
 */
enum orientEnum {
    landscape,
    portrait
}


interface coordinate {
    x: number,
    y: number;
}

interface slideLayoutData {
    width: number,
    height: number,
    borderPx: number,
}

function getInfoString(responseData) {
    let newline = "\n";

    let infoString = responseData.report_month + " " + responseData.report_year + newline +
        "Area: " + responseData.area_name + newline
        + "gascard: " + responseData.card_number + newline
        + "Miles Used: " + responseData.mile_sum + newline
        + "Zone: " + responseData.zone;
    if (config.debug_mode) {
        infoString += newline + "git commit: " + GITHUB_DATA.commit_sha.slice(0, 8);
    }
    
    if (responseData.has_forgiveness == true && +responseData.qty_forgiveness > 0) {
        infoString += newline + "Forgiveness Miles: " + responseData.qty_forgiveness;
    }
    return infoString;
}

function createGasCardNumber(gasSlide: GoogleAppsScript.Slides.Slide, responseData: logResponseEntry,sL:slideLayoutData):GoogleAppsScript.Slides.Shape {
    const width = 50
    const height = 50
    let infoBox = gasSlide.insertTextBox(String(responseData.card_number))
    infoBox.setWidth(width)
    infoBox.setHeight(height)
    infoBox.setTop(sL.borderPx)
    // aligns it to the far edge minus the hard-coded width and the border margin thingy.
    infoBox.setLeft(sL.width - width - sL.borderPx)
    let test = infoBox.getText().getTextStyle()
    test.setFontSize(30)
    test.setFontFamily("Inconsolata")

    return infoBox


}
function gasSlideEditor(gasSlide: GoogleAppsScript.Slides.Slide, responseData: logResponseEntry, imageUrl1: string, imageUrl2: string | null, index: number) {
    // Step 1: Add Photo

    // let photo = gasSlide.insertImage()
    // WYL0 2022-10-07 : Need to figure out how to load images.  :)
    let sL: slideLayoutData = {
        width: 612,
        height: 793,
        borderPx: 10
    };

    let infoBoxData = {
        width: (sL.width - 4 * sL.borderPx) / 3,
        height: 110
    };

    let receiptBoxData = {
        width: infoBoxData.width,/*(sL.width / 3) - 2 * sL.borderPx,*/
        height: 110
    };

    let newline = "\n";
    let infoString = getInfoString(responseData);
    // TODO: CREATE TABLE OF RECEIPT DATES AND COSTS
    //@ts-ignore : JSFiddle says +null has a typeof "number", which is good enough for me

    const gasCardNumber = createGasCardNumber(gasSlide, responseData, sL)

    let infoBox = gasSlide.insertTextBox(infoString, sL.borderPx, sL.borderPx, infoBoxData.width, infoBoxData.height);
    // console.log(gasSlide.getLayout());

    // Generates the receipt date:cost informations
    // groups into two batches of 6 receipts per box
    let receiptString1 = "";
    let receiptString2 = "";
    let existentReceipts = 0;
    const receiptDateKeys: string[] = ["rp_1", "rp_2", "rp_3", "rp_4", "rp_5", "rp_6", "rp_7", "rp_8", "rp_9", "rp_10", "rp_11", "rp_12"];
    const receiptCostKeys: string[] = ["rc_1", "rc_2", "rc_3", "rc_4", "rc_5", "rc_6", "rc_7", "rc_8", "rc_9", "rc_10", "rc_11", "rc_12"];
    const maxReceiptsOneBox = 6; // 1-indexed
    for (const i = 0; i < receiptCostKeys.length; i++) {
        let output = "";
        let hasEntry = false;
        if (responseData.hasOwnProperty(receiptDateKeys[i]) && responseData[receiptDateKeys[i]] != "") {
            let dateObj = new Date(responseData[receiptDateKeys[i]]);
            let formattedString: string = (dateObj.getMonth() + 1) + "/" + dateObj.getDate() + "/" + dateObj.getFullYear();
            output += formattedString + ": ";
            hasEntry = true;
        }
        if (responseData.hasOwnProperty(receiptCostKeys[i]) && responseData[receiptCostKeys[i]] != "") {
            output += "$ " + Number(responseData[receiptCostKeys[i]]).toFixed(2);
            hasEntry = true;
        } else if (hasEntry) {
            output += "N/A";
        }
        if (hasEntry) {
            existentReceipts += 1;
            output += newline;
        }

        if (existentReceipts <= maxReceiptsOneBox) {
            receiptString1 += output;
        } else {
            receiptString2 += output;
        }
    }


    const receiptBox = gasSlide.insertTextBox(receiptString1, infoBoxData.width + sL.borderPx * 2, sL.borderPx, receiptBoxData.width, receiptBoxData.height);

    if (receiptString2 != "") {
        let xPos = infoBoxData.width + receiptBoxData.width + sL.borderPx * 3;
        let receiptBox2 = gasSlide.insertTextBox(receiptString2, xPos, sL.borderPx, receiptBoxData.width, receiptBoxData.height);
    }

    const textMaxHeight = Math.max(infoBoxData.height, receiptBoxData.height);

    const imageHeight = (sL.height - (textMaxHeight + 4 * sL.borderPx)) / 2;
    const top1 = textMaxHeight + sL.borderPx * 2;
    const top2 = textMaxHeight + sL.borderPx * 3 + imageHeight;


    if (imageUrl1) {
        try {
            const imageBlob1 = getImageBlobFromID(getIdFromUrl_(imageUrl1));
            if (imageBlob1) {
                const photo1 = gasSlide.insertImage(imageBlob1);
                alignImage(photo1, orientEnum.landscape, sL, top1, imageHeight);
            }
            
        } catch (error) {
            console.error("unable to load image for",imageUrl1)
        }
    }

    if (imageUrl2) {
        try {
            const imageBlob2 = getImageBlobFromID(getIdFromUrl_(imageUrl2));
            if (imageBlob2) {
                const photo2 = gasSlide.insertImage(imageBlob2);
                alignImage(photo2, orientEnum.landscape, sL, top2, imageHeight);
            }
            
        } catch (error) {
            console.error("unable to insert image for",imageUrl2)
        }
    }




}

function logSlideEditor(gasSlide: GoogleAppsScript.Slides.Slide, responseData: logResponseEntry, imageUrl: string, index: number) {
    // Step 1: Add Photo

    // let photo = gasSlide.insertImage()
    // WYL0 2022-10-07 : Need to figure out how to load images.  :)
    let sL: slideLayoutData = {
        width: 612,
        height: 793,
        borderPx: 10
    };


    let infoString = getInfoString(responseData);

    let infoBoxData = {
        width: sL.width - 2 * sL.borderPx,
        height: 100
    };
    const gasCardNumber = createGasCardNumber(gasSlide, responseData, sL)
    let infoBox = gasSlide.insertTextBox(infoString, 10, 10, infoBoxData.width, infoBoxData.height);
    // console.log(gasSlide.getLayout())

    let minImageHeight = infoBoxData.height + sL.borderPx;


    let imageBlob = getImageBlobFromID(getIdFromUrl_(imageUrl));
    // let imageClass = loadImageFromId(imageId)
    if (imageBlob) {
        try {
            let photo = gasSlide.insertImage(imageBlob);
    
            alignImage(photo, orientEnum.portrait, sL, minImageHeight);
            
        } catch (error) {
            console.error("unable to load log image for ",imageUrl)
        }

    } else {
        console.warn("Couldn't Load Mileage Log for GC# " + responseData.card_number + " for " + responseData.report_month + " " + responseData.report_year);
    }



}

/**
 *
 *
 * @param {GoogleAppsScript.Slides.Image} photo - the photo to be modified
 * @param {orientEnum} orientation - final orientation of  image, either orientEnum.landscape or orientEnum.portrait
 * @param {slideLayoutData} sL - data about the slide.
 * @param {number} top - how far from the top the image starts
 * @param {number} [maxImageHeight] - if you want to stick something else on the slide with an image, use this.  Otherwise, the image will use all available height.
 */
function alignImage(photo: GoogleAppsScript.Slides.Image, orientation: orientEnum, sL: slideLayoutData, top: number, maxImageHeight?: number) {
    // photo.setLeft(20)

    // let availableHeight = sL.height - top - sL.borderPx;

    let imageWidth = photo.getWidth();
    let imageHeight = photo.getHeight();
    let wasRotated = false;

    let prWidth: number = imageWidth; // post-rotate width, I need them to be separate because calcs...
    let prHeight: number = imageHeight;
    // Step 1: Determine if rotation is needed
    if (imageHeight > imageWidth && orientation == orientEnum.landscape) {
        wasRotated = true;
        photo.setRotation(90);
        prWidth = imageHeight;
        prHeight = imageWidth;
    } else if (imageWidth > imageHeight && orientation == orientEnum.portrait) {
        wasRotated = true;
        photo.setRotation(90);
        prWidth = imageHeight;
        prHeight = imageWidth;
    }

    // Step 2: Calculate Scale Values by width
    // if resulting height would be too big, then scale by height instead

    let maxWidth: number = sL.width - 2 * sL.borderPx;
    let maxHeight: number;
    let imageBoxHeight: number;
    if (maxImageHeight) {
        maxHeight = maxImageHeight; /*+ sL.borderPx * 2;*/
        imageBoxHeight = maxImageHeight;
    } else {
        maxHeight = sL.height - top - sL.borderPx; // NOT removing this sL.borderPx because this keeps it off the bottom if there's only one image
        imageBoxHeight = sL.height - top;
    }



    let scaleVal = maxWidth / prWidth;
    if (maxHeight < scaleVal * prHeight) {
        scaleVal = maxHeight / prHeight;
    }

    prWidth = prWidth * scaleVal;
    prHeight = prHeight * scaleVal;


    // Step 3: Set scale for image
    photo.scaleHeight(scaleVal);
    photo.scaleWidth(scaleVal);



    // Step 4: Calculate & set position for image
    //      if image is rotated, set anchor point and go from there

    let imageCenterX = (sL.width / 2); /*- sL.borderPx*/
    let imageCenterY = ((imageBoxHeight) / 2) + top;

    let anchors: coordinate[] = [

        {
            x: imageCenterX - (prWidth / 2),
            y: imageCenterY - (prHeight / 2)
        },
        {
            x: imageCenterX + (prWidth / 2),
            y: imageCenterY - (prHeight / 2)
        },
        {
            x: imageCenterX - (prWidth / 2),
            y: imageCenterY + (prHeight / 2)
        },
        {
            x: imageCenterX + (prWidth / 2),
            y: imageCenterY + (prHeight / 2)
        }
    ];
    // During testing: You should be able to change which corner gets used on rotates by changing the x in anchors[x] fairly easily.
    if (wasRotated == true) {
        let anchor = 2;
        console.error(anchors[anchor]);
        let psuedoX = imageCenterX - (prHeight / 2);
        let psuedoY = imageCenterY - (prWidth / 2);
        photo.setLeft(psuedoX);
        photo.setTop(psuedoY);
    } else {
        let anchor = 0;
        console.warn(anchors[anchor]);
        photo.setLeft(anchors[anchor].x);
        photo.setTop(anchors[anchor].y);
        // photo.setLeft(sL.borderPx);
        // photo.setTop(top + sL.borderPx);
    }
}

function getImageBlobFromID(imageId: string): GoogleAppsScript.Base.Blob | null {
    try {
        let image = DriveApp.getFileById(imageId);
        // let metaData = image.getMimeType()
        let imageBlob = image.getBlob();
        return imageBlob;
    } catch (e) {
        return null;
    }
}






function getLogbook(year: string | number, month: string): GoogleAppsScript.Slides.Presentation {
    // step 1: get the containing folder
    let parentFolder = getSlideFolder();

    let fileIt = parentFolder.getFiles();
    let targetFilename = month + " " + String(year) + " autoLog";
    let files: GoogleAppsScript.Drive.File[] = [];

    while (fileIt.hasNext()) {
        files.push(fileIt.next());
    }

    for (let file of files) {
        if (file.getName() == targetFilename) {
            let presentation = SlidesApp.openById(file.getId());
            return presentation;
        }
    }
    // if it's not there, we create a template
    // if there isn't a template, then we just make a slide anyways.
    if (GITHUB_SECRET_DATA.hasOwnProperty("template_id")) {
        try {
            let template = DriveApp.getFileById(GITHUB_SECRET_DATA["template_id"]);
            // let template = Drive.getF()

            let newOne = template.makeCopy(targetFilename, parentFolder);
            let newId = newOne.getId();
            let presentationOut = SlidesApp.openById(newId);
            modifyTitlePage(presentationOut, year, month);
            return presentationOut;
        } catch (error) {
            console.warn(error);
        }
    }

    let newBoi = SlidesApp.create(targetFilename);
    // move to the right folder
    let driveFile = DriveApp.getFileById(newBoi.getId());
    driveFile.moveTo(parentFolder);
    console.error("Couldn't find template, so you get lame stuff");
    return newBoi;

}



function modifyTitlePage(presentation: GoogleAppsScript.Slides.Presentation, year: string | number, month: string) {
    let slides = presentation.getSlides();
    if (slides.length > 0) {
        let baseslide = slides[0];
        let subtitleString = month + " " + String(year);
        try {
            baseslide.replaceAllText("DATE_STRING", subtitleString, true);
        } catch (error) {
            console.log(error);
        }
        try {
            baseslide.replaceAllText("Click to add subtitle", subtitleString);

        } catch (error) {
            console.warn("below error is because it couldn't find something to replace.");
            console.log(error);
        }
    }
}


function getSlideFolder(): GoogleAppsScript.Drive.Folder {
    let baseFolder = getBaseFolder();
    let photoFolderName = "Print-Ready";
    let folderTest = baseFolder.getFoldersByName(photoFolderName);
    // Check to see if there's a folder with a matching name
    if (folderTest.hasNext()) {
        let folder = folderTest.next();
        return folder;
    }
    else {
        let folder = baseFolder.createFolder(photoFolderName);
        return folder;
    }
}