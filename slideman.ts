
function tester() {
    // load up the logbook we need
    let presentation = getLogbook(2022, "August");
    // load up the data we're going to work with 
    let slidedataStore: sheetDataEntry = datastoreConfig
    let slideSheetData = new SheetData(new RawSheetData(slidedataStore))
    let logResponseDatastore:sheetDataEntry = responseConfig
    let entryData = new SheetData(new RawSheetData(logResponseDatastore))

    let entryClass = new kiDataClass(entryData.getData())
    // save where we are with responses so that we don't wind up with duplicates.  Marking as pulled happens at the very very end.
    let responseQTY = entryClass.end.length


    // filter to only new responses, and then add them to the correct thing.
    //@ts-ignore not sure how to guarantee that this will have all of the req'd fields, but it should by definii
    let newResponses:slideDataEntry[] = entryClass.removeMatching("pulled", true)

    let slideDataObj: kiDataClass = new kiDataClass(slideSheetData.getData())
    //blah @ts-ignore not sure how to require .end to return a particular subtype yet...
    let slideData: slideDataEntry[] = convertKisToSlideEntries(slideDataObj.end)
    let initialIndex = buildPositionalIndex(slideDataObj.end, "keyToBaseOffOf")
    
    for (let response of newResponses) {
        // build index, because it gets out of date

        let newSlides: slideDataEntry = addSlidesForEntry(response, presentation, slideData)
        slideData.push(newSlides)
    }


}

function buildPositionalIndex(data: kiDataEntry[], keyToBaseOffOf: string):positionalIndex {
    let output:positionalIndex = {};
    for (let i = 0; i > data.length; i++){
        if (data[i].hasOwnProperty(keyToBaseOffOf) && +data[i][keyToBaseOffOf] != -1) {
            output[+data[i][keyToBaseOffOf]] = data[i] 
        }
    }
    return output
}

function getSlideToInsertBefore(presentation: GoogleAppsScript.Slides.Presentation, position: number, slideData:positionalIndex):string|null {
    
    // thanks to this guy for this little conversion
    // https://bobbyhadz.com/blog/javascript-convert-array-of-strings-to-array-of-numbers#:~:text=To%20convert%20an%20array%20of,new%20array%20containing%20only%20numbers.
    let keys = Object.keys(slideData).map(str => {
        return Number(str);
    });
    
    let bestCandidate = Infinity;

    // and thanks to these people for this part:
    // https://stackoverflow.com/questions/54554384/get-closest-but-higher-number-in-an-array

    //get rid of everything bigger (or smaller???)
    // TODO greater than or equal to?  Need to test with two of the same gas card for certainty,  kinda depends on if I want second entries before or after the first ones
    const higherCandidates = keys.filter(candidate => candidate > position)
    
    // loop through numbers and checks to see if next number is less bigger but still bigger

    higherCandidates.forEach(candidate => {
        if (candidate < bestCandidate) { bestCandidate = candidate; }
    }

    )

    if (bestCandidate != Infinity) {
        if (slideData[bestCandidate].hasOwnProperty("logPageIdList")){
            let outData: string[] = slideData[bestCandidate]["logPageIdList"].split(",")
            if (outData.length > 0 && outData[0] != "") {
                return outData[0]
            }
        }
    }
    // basically fat ELSE return, because the function should break at this point.
    return null



}

function createNewSlide(targetPresentation: GoogleAppsScript.Slides.Presentation,preSlide:string|null):GoogleAppsScript.Slides.Slide {
    let outSlide:GoogleAppsScript.Slides.Slide
    if (preSlide != null) {
        outSlide = targetPresentation.insertSlide(+preSlide)
    } else {
        outSlide = targetPresentation.appendSlide()
    }

    // outSlide.insertTextBox(outSlide.getObjectId(), 10, 10,2000,200)
    return outSlide
}

function loadImageFromId(id: string) {}

    enum orientEnum {
    landscape,
    portrait
}
function alignImage(photo: GoogleAppsScript.Slides.Image,orientation:orientEnum) {
    // photo.setLeft(20)
    if (orientation == orientEnum.landscape) {
        if (photo.getHeight() > photo.getWidth()) {
            photo.setRotation(90)
        } else {
        }
    } else {
        if (photo.getWidth() > photo.getHeight()) {
            photo.setRotation(270)
            photo.setTop(200);
            photo.setLeft(-50);
            photo.setWidth(500)
        } else {
            photo.setTop(200);
            photo.setLeft(45);
            photo.setHeight(500)
        }
    }
    // photo.setHeight(50)
    


}

function gasSlideEditor(gasSlide: GoogleAppsScript.Slides.Slide, responseData: logResponseEntry,imageUrl:string,index:number) {
    // Step 1: Add Photo
    
    // let photo = gasSlide.insertImage()
    // WYL0 2022-10-07 : Need to figure out how to load images.  :)
    let imageId = getIdFromUrl_(imageUrl)
    // let imageURL = "https://drive.google.com/file/d/" + imageId
    let image = DriveApp.getFileById(imageId)
    // let metaData = image.getMimeType()
    let imageBlob = image.getBlob()
    // let imageClass = loadImageFromId(imageId)
    let photo = gasSlide.insertImage(imageBlob)
    alignImage(photo, orientEnum.portrait)
    let newline = "\n"
    let infoString = "AreaName: " + responseData.area_name + newline
        + "gascard: " + responseData.card_number + newline
        + "Miles Used: " + responseData.mile_sum
    if (responseData.has_forgiveness) {
        infoString += newline + "Forgiveness Miles: " + responseData.qty_forgiveness
    }
    gasSlide.insertTextBox(infoString,10,10,500,120)
    // photo.alignOnPage("CENTER") // or AlignmentPosition.CENTER ??



}

function addSlidesForEntry(responseData: logResponseEntry, targetPresentation: GoogleAppsScript.Slides.Presentation, positionalIndex: positionalIndex):slideDataEntry {

    let outEntry: slideDataEntry = {
        gasCard: 0,
        logPageIdList: '',
        receiptPageIdList: '',
        month: '',
        year: '',
        logPageIdArray: [],
        receiptPageIdArray: [],
        startPosition:-1,
    };

    // Step 1: build index to figure out where we're supposed to stick data

    // WYLO: trying to figure out the right order for how to do this 

    // WYLO 2022-10-06 : need to break this out into a function properly so that I can reuse things cleanly.  Might have two functions, one for gas & one for logs, or an internal if for switching between the two.
    let postSlideId = getSlideToInsertBefore(targetPresentation, Number(responseData.gasCard), positionalIndex)
    
    let logSlides: GoogleAppsScript.Slides.Slide[] = []
    let logPages = String(responseData.log_pics).trim().split(",")
    let iterant = 0
    for (let entry of logPages) {
        
        let gasSlide = createNewSlide(targetPresentation, postSlideId)
        gasSlideEditor(gasSlide, responseData, entry,iterant)

        iterant += 1
        // , logSlides.length)
        
    }


    /*
        WYLO 2: not done defining types on my way to TS-verified results

    */
    
}



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

*/

function getLogbook(year:string|number,month:string):GoogleAppsScript.Slides.Presentation {
    // step 1: get the containing folder
    let parentFolder = getSlideFolder()

    let fileIt = parentFolder.getFiles()
    let targetFilename = month + " " + String(year) + " autoLog"
    let files: GoogleAppsScript.Drive.File[] = []
    
    while (fileIt.hasNext()) {
        files.push(fileIt.next())
    }

    for (let file of files) {
        if (file.getName() == targetFilename) {
            let presentation = SlidesApp.openById(file.getId())
            return presentation
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
            modifyTitlePage(presentationOut, year, month)
            return presentationOut;
        } catch (error) {
            console.warn(error);
        }
    }

    let newBoi = SlidesApp.create(targetFilename)
    // move to the right folder
    let driveFile = DriveApp.getFileById(newBoi.getId())
    driveFile.moveTo(parentFolder)
    console.error("Couldn't find template, so you get lame stuff")
    return newBoi

}



function modifyTitlePage(presentation: GoogleAppsScript.Slides.Presentation,year:string|number,month:string) {
    let slides = presentation.getSlides()
    if (slides.length > 0) {
        let baseslide = slides[0]
        let subtitleString = month + " " + String(year)
        try {
            baseslide.replaceAllText("DATE_STRING", subtitleString, true)
        } catch (error) {
            console.log(error)
        }
        try {
            baseslide.replaceAllText("Click to add subtitle", subtitleString)
            
        } catch (error) {
            console.warn("below error is because it couldn't find something to replace.")
            console.log(error)
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