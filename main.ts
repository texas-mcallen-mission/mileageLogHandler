let sheetConfig: sheetDataEntry = {
    tabName: "Form Responses",
    headerRow: 0,
    includeSoftcodedColumns: true,
    initialColumnOrder: {
        timestamp: 1,
        area_name: 2,
        email: 3,
        report_month: 4,
        report_year: 5,
        pulled: 6,
        car_year: 7,
        car_make: 8,
        car_model: 9,
        car_lpn: 10,
        car_vin_five: 11,
        card_number: 12,
        odo_start: 13,
        odo_end: 14,
        mile_sum: 15,
        has_forgiveness: 16,
        qty_forgiveness: 17,
        forgive_types: 18,
        rp_1: 19,
        rc_1: 20,
        rp_2: 21,
        rc_2: 22,
        rp_3: 23,
        rc_3: 24,
        rp_4: 25,
        rc_4: 26,
        rp_5: 27,
        rc_5: 28,
        rp_6: 29,
        rc_6: 30,
        rp_7: 31,
        rc_7: 32,
        rp_8: 33,
        rc_8: 34,
        rp_9: 35,
        rc_9: 36,
        rp_10: 37,
        rc_10: 38,
        rp_11: 39,
        rc_11: 40,
        rp_12: 41,
        rc_12: 42,
        gas_pics: 43,
        log_pics: 44,
    }
};

interface folderReturn {
    id: string,
    folder: GoogleAppsScript.Drive.Folder
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

interface log_data extends kiDataEntry {
    timestamp: string,
    area_name: string,
    email: string,
    report_month: string,
    report_year: string | number,
    pulled: boolean | "" | null,
    car_year: number,
    car_make: string,
    car_model: string,
    car_lpn: string,
    car_vin_five: string | number,
    card_number: string,
    odo_start: number,
    odo_end: number,
    mile_sum: number,
    gas_pics: string,
    log_pics: string,
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
    }

    return document.makeCopy(newName,targetFolder)

}

function getIdFromUrl_(url: string):string {
    return url.match(/[-\w]{25,}(?!.*[-\w]{25,})/).toString();
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
    let rsdIn1 = new RawSheetData(sheetConfig)
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