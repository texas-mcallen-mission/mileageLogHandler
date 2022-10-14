
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
    let newResponses:logResponseEntry[] = entryClass.removeMatching("pulled", true)

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
function alignImage(photo: GoogleAppsScript.Slides.Image, orientation: orientEnum, sL: slideLayoutData, minHeight: number,maxImageHeight?:number) {
    // photo.setLeft(20)

    let availableHeight = sL.height - minHeight - sL.borderPx

    let imageWidth = photo.getWidth()
    let imageHeight = photo.getHeight()
    let wasRotated = false

    let prWidth: number = imageWidth; // post-rotate width, I need them to be separate because calcs...
    let prHeight:number = imageHeight
    // Step 1: Determine if rotation is needed
    if (imageHeight > imageWidth && orientation == orientEnum.landscape) {
        wasRotated = true
        photo.setRotation(90)
        prWidth = imageHeight
        prHeight = imageWidth
    } else if (imageWidth > imageHeight && orientation == orientEnum.portrait) {
        wasRotated = true
        photo.setRotation(90)
        prWidth = imageHeight;
        prHeight = imageWidth        
    }

    // Step 2: Calculate Scale Values by width
    // if resulting height would be too big, then scale by height instead
    
    let maxWidth:number = sL.width - 2 * sL.borderPx
    let maxHeight: number
    let imageBoxHeight : number
    if (maxImageHeight) {
        maxHeight = maxImageHeight+ sL.borderPx*2
        imageBoxHeight = maxImageHeight
    } else {
        maxHeight = sL.height - (minHeight) + sL.borderPx * 2
        imageBoxHeight = (sL.height - minHeight)
    }

    

    let scaleVal = maxWidth / prWidth
    if (maxHeight < scaleVal * prHeight) {
        scaleVal = maxHeight / prHeight
    }

    prWidth = prWidth * scaleVal
    prHeight = prHeight * scaleVal


    // Step 3: Set scale for image
    photo.scaleHeight(scaleVal)
    photo.scaleWidth(scaleVal)



    // Step 4: Calculate & set position for image
    //      if image is rotated, set anchor point and go from there

    let imageCenterX = (sL.width / 2) /*- sL.borderPx*/
    let imageCenterY = ((imageBoxHeight)/2) + minHeight

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
    ]
    // During testing: You should be able to change which corner gets used on rotates by changing the x in anchors[x] fairly easily.
    if (wasRotated == true) {
        let anchor = 2
        console.error(anchors[anchor])
        let psuedoX = imageCenterX - (prHeight / 2)
        let psuedoY = imageCenterY - (prWidth / 2)
        photo.setLeft(psuedoX);
        photo.setTop(psuedoY);
    } else {
        let anchor = 0;
        console.warn(anchors[anchor]);
        photo.setLeft(anchors[anchor].x);
        photo.setTop(anchors[anchor].y);
        // photo.setLeft(sL.borderPx);
        // photo.setTop(minHeight + sL.borderPx);
    }
}

interface coordinate {
    x: number,
    y:number
}

interface slideLayoutData {
    width: number,
    height: number,
    borderPx: number
}

function gasSlideEditor(gasSlide: GoogleAppsScript.Slides.Slide, responseData: logResponseEntry, imageUrl: string, index: number) {
    // Step 1: Add Photo
    
    // let photo = gasSlide.insertImage()
    // WYL0 2022-10-07 : Need to figure out how to load images.  :)
    let sL:slideLayoutData = {
        width: 612,
        height: 793,
        borderPx:10
    }
    let imageId = getIdFromUrl_(imageUrl)
    // let imageURL = "https://drive.google.com/file/d/" + imageId
    let image = DriveApp.getFileById(imageId)
    // let metaData = image.getMimeType()
    let imageBlob = image.getBlob()
    // let imageClass = loadImageFromId(imageId)
    let photo = gasSlide.insertImage(imageBlob)
    let newline = "\n"
    let infoString = "AreaName: " + responseData.area_name + newline
    + "gascard: " + responseData.card_number + newline
    + "Miles Used: " + responseData.mile_sum
    if (responseData.has_forgiveness == true && +responseData.qty_forgiveness > 0) {
        infoString += newline + "Forgiveness Miles: " + responseData.qty_forgiveness
    }
    let infoBoxData = {
        width: sL.width - 2 * sL.borderPx,
        height: 100
    }
    let infoBox = gasSlide.insertTextBox(infoString, 10, 10, infoBoxData.width, infoBoxData.height)
    console.log(gasSlide.getLayout())
    

    
    let minHeight = infoBoxData.height + sL.borderPx
    alignImage(photo, orientEnum.portrait, sL, minHeight, 500) // TODO remove height
    // infoBox.getText().
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