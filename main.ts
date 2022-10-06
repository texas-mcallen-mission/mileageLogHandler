let responseConfig: sheetDataEntry = {
    tabName: "Form Responses",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        timestamp: 0,
        area_name: 1,
        email: 2,
        report_month: 3,
        report_year: 4,
        pulled: 5,
        car_year: 6,
        car_make: 7,
        car_model: 8,
        car_lpn: 9,
        car_vin_five: 10,
        card_number: 11,
        odo_start: 12,
        odo_end: 13,
        mile_sum: 14,
        has_forgiveness: 15,
        qty_forgiveness: 16,
        forgive_types: 17,
        rp_1: 18,
        rc_1: 19,
        rp_2: 20,
        rc_2: 21,
        rp_3: 22,
        rc_3: 23,
        rp_4: 24,
        rc_4: 25,
        rp_5: 26,
        rc_5: 27,
        rp_6: 28,
        rc_6: 29,
        rp_7: 30,
        rc_7: 31,
        rp_8: 32,
        rc_8: 33,
        rp_9: 34,
        rc_9: 35,
        rp_10: 36,
        rc_10: 37,
        rp_11: 38,
        rc_11: 39,
        rp_12: 40,
        rc_12: 41,
        gas_pics: 42,
        log_pics: 43,
    }
};


let datastoreConfig: sheetDataEntry = {
    tabName: "slideData",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        gasCard: 0,
        logPageIdList: 1,
        receiptPageIdList: 2,
        month: 3,
        year: 4,

    }
}

function getBaseFolder(): GoogleAppsScript.Drive.Folder {
    let sheetFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
    let parentFolder = sheetFile.getParents()
    let outFolder = parentFolder.next()
    let id = outFolder.getId()

    return outFolder
}

function getPhotoFolder(): GoogleAppsScript.Drive.Folder {
    let baseFolder = getBaseFolder()

    let photoFolderName = "Log Photos"
    let folderTest = baseFolder.getFoldersByName(photoFolderName)

    // Check to see if there's a folder with a matching name
    if (folderTest.hasNext()) {
        let folder = folderTest.next()
        return folder
        
    } else {
        let folder = baseFolder.createFolder(photoFolderName)
        return folder
    }
}



// takes a folder, a drive Document, and a 2d array of subfolders, copy a thing.  Returns a GoogleAppsScript.Drive.File of the copied object.
//
function copyToSubfolderByArray_(document: GoogleAppsScript.Drive.File, parentFolder: GoogleAppsScript.Drive.Folder, subfolders: string[],newName:string):GoogleAppsScript.Drive.File {
    let targetFolder = parentFolder
    let subFolderIterant = [...subfolders] // yay mutatability!
    
    // maybe check subfolders to see if it's an array?  It's type-required though :)
    while (subFolderIterant.length > 0) {
        let newTarget = targetFolder.getFoldersByName(subFolderIterant[0])
        if (newTarget.hasNext()) {
            targetFolder = newTarget.next()
        } else {
            let newTarget = targetFolder.createFolder(subFolderIterant[0])
            targetFolder = newTarget
        }
        subFolderIterant.shift()
    }

    return document.makeCopy(newName,targetFolder)

}

function getIdFromUrl_(url: string): string {
    let regexData = url.match(/[-\w]{25,}(?!.*[-\w]{25,})/) 
    if (regexData == null) {
        return ""
    } else {
        return regexData.toString()
    }

}

function getDocumentFromURL_(url):GoogleAppsScript.Drive.File | null {
    let docId = getIdFromUrl_(url)
    try {
        let document: GoogleAppsScript.Drive.File = DriveApp.getFileById(docId)
        return document
    } catch (error) {
        console.log(error)
        return null
    }
}
function moveNewPhotosToFolders() {
    let rsdIn1 = new RawSheetData(responseConfig)
    let log_responses = new SheetData(rsdIn1)

    let data = log_responses.getData()
    let rows_pulled = data.length

    let logData: kiDataClass = new kiDataClass(data)
    
    let photoFolder = getPhotoFolder()

    // @ts-expect-error I know this is maybe not the best form, but I can almost guarantee this format, and it makes things easier down the line.  #watchme
    let start_data:log_data[] = logData.keepMatchingByKey("pulled", [""]).end
    let newPhotos:GoogleAppsScript.Drive.File[] = []
    for (let submission of start_data) {
        let gas_pic_urls:string[] = submission.gas_pics.split(",")
        let log_pic_urls: string[] = submission.log_pics.split(",")
        let gas_iterant: number = 1
        let log_iterant: number = 1
        // GR for gas, LB for log books
        let subFolders :string[]= [String(submission.report_year),submission.report_month]
        for (let entry of gas_pic_urls) {
            entry.trim()
            let targetPhoto = getDocumentFromURL_(entry)
            let newName = String(submission.card_number) + "_GR_" + String(gas_iterant)
            if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName) 
                newPhotos.push(organizedPhoto)
            }
        }
        for (let entry of log_pic_urls) {
            entry.trim();
            let targetPhoto = getDocumentFromURL_(entry);
            let newName = String(submission.card_number) + "_LP_" + String(log_iterant);
            if (targetPhoto) { // makes sure that getDocumentFromURL doesn't fail and return null
                let organizedPhoto = copyToSubfolderByArray_(targetPhoto, photoFolder, subFolders, newName);
                newPhotos.push(organizedPhoto);
            }
        }
    }

    // at this point, all I need to do is mark things as pulled and the sorting of photos is done.
    // I also need to add a cache locker so that I don't end up with duplicates.


}