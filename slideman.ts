
function tester() {
    // load up the logbook we need
    let presentation = getLogbook(2022, "August");
    // load up the data we're going to work with 
    let slidedataStore: sheetDataEntry = datastoreConfig
    let slideData = new SheetData(new RawSheetData(slidedataStore))
    let logResponseDatastore:sheetDataEntry = responseConfig
    let entryData = new SheetData(new RawSheetData(logResponseDatastore))

    let entryClass = new kiDataClass(entryData.getData())
    // save where we are with responses so that we don't wind up with duplicates.  Marking as pulled happens at the very very end.
    let responseQTY = entryClass.end.length


    // filter to only new responses, and then add them to the correct thing.
    let newResponses = entryClass.removeMatching("pulled", true)



    for (let response of newResponses) {
        // build index, because it gets out of date
    }

    
}

function addEntry(responseData:slideDataEntry,targetPresentation:GoogleAppsScript.Slides.Presentation,kiDataForIndexing:slideDataEntry[]) {
    // Step 1: build index to figure out where we're supposed to stick data

    // WYLO: trying to figure out the right order for how to do this 

    /*
        I think the best way to do this is have addEntry return a new slideDataEntry object to add to to the end of the ki data stuff
        every entry can *also* get immediately saved into the sheet so that if I experience a crash on a future entry in the loop I don't lose progress
        seems like a fairly bulletproof way to do it??


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