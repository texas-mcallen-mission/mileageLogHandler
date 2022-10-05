function slideTester() {
    let slideID = "1bMgAWOXlBHZwpU5NuvrPvGV6dxoDB1B7Vjw4xdQ3tp0";

    let presentation = SlidesApp.openById(slideID);

    let slides = presentation.getSlides();

    let targetSlide = presentation.appendSlide();

    console.log(targetSlide.getObjectId());
    console.log(targetSlide.getPageElements());
    targetSlide.insertTextBox(targetSlide.getObjectId(), 20, 30, 400, 200);
    for (let slide of slides) {
        console.log(slide);
        let notes = slide.getNotesPage();
        console.log(notes);
        console.log(notes.toString());
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

function getPresentation(year:string|number,month:string):GoogleAppsScript.Slides.Presentation {
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

function tester() {
    let presentation = getPresentation(2022, "August")
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